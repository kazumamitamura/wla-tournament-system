-- =============================================================================
-- WLA Tournament System - Initial Schema Migration
-- =============================================================================
-- 既存の Supabase プロジェクト (Master-Portfolio-DB) に同居するため、
-- すべてのオブジェクト名に `wla_` 接頭辞を付与する。
--
-- 設計ポイント:
--   1. オフラインファースト: クライアントで UUIDv4 を生成して id に指定する想定。
--      DEFAULT gen_random_uuid() はサーバーサイド挿入時のフォールバック。
--   2. 論理削除: deleted_at カラムで管理。DELETE 権限は付与しない。
--   3. リアルタイム同期: wla_session_state テーブルで進行状態を一元管理。
--      Supabase Realtime の Broadcast / Postgres Changes を活用。
--   4. IWFルール準拠: changes_count (最大2), is_first_attempt_lowered フラグ,
--      timer_started_at で 30 秒ルールを判定可能。
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper: updated_at 自動更新トリガー関数
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION wla_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- 1. wla_tournaments (大会情報)
-- ===========================================================================
CREATE TABLE wla_tournaments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  date       DATE NOT NULL,
  venue      TEXT,
  status     TEXT NOT NULL DEFAULT 'planning'
               CHECK (status IN ('planning', 'ongoing', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER wla_tournaments_updated_at
  BEFORE UPDATE ON wla_tournaments
  FOR EACH ROW EXECUTE FUNCTION wla_set_updated_at();


-- ===========================================================================
-- 2. wla_athletes (選手名簿)
-- ===========================================================================
CREATE TABLE wla_athletes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES wla_tournaments(id),
  name          TEXT NOT NULL,
  team          TEXT,                         -- 所属
  weight_class  TEXT,                         -- 階級 (例: "73", "81", "+109")
  gender        TEXT CHECK (gender IN ('male', 'female')),
  body_weight   NUMERIC(5,2),                 -- 検量体重 (kg)
  entry_snatch  INTEGER,                      -- エントリー重量 (SN)
  entry_cj      INTEGER,                      -- エントリー重量 (C&J)
  lot_number    INTEGER,                      -- 抽選番号
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE TRIGGER wla_athletes_updated_at
  BEFORE UPDATE ON wla_athletes
  FOR EACH ROW EXECUTE FUNCTION wla_set_updated_at();

-- FK & 検索用インデックス
CREATE INDEX idx_wla_athletes_tournament_id ON wla_athletes(tournament_id);
CREATE INDEX idx_wla_athletes_weight_class  ON wla_athletes(tournament_id, weight_class);


-- ===========================================================================
-- 3. wla_attempts (試技記録 - コア機能)
-- ===========================================================================
CREATE TABLE wla_attempts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id               UUID NOT NULL REFERENCES wla_athletes(id),
  type                     TEXT NOT NULL CHECK (type IN ('snatch', 'cj')),
  attempt_num              SMALLINT NOT NULL CHECK (attempt_num BETWEEN 1 AND 3),
  declared_weight          INTEGER,                -- 申告重量 (kg)
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'success', 'fail', 'pass')),
  changes_count            SMALLINT NOT NULL DEFAULT 0
                             CHECK (changes_count BETWEEN 0 AND 2),
  timer_started_at         TIMESTAMPTZ,            -- 時計が動いた時刻
  is_first_attempt_lowered BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at               TIMESTAMPTZ,

  -- 同一選手の同一種目・同一試技番号はユニーク
  UNIQUE (athlete_id, type, attempt_num)
);

CREATE TRIGGER wla_attempts_updated_at
  BEFORE UPDATE ON wla_attempts
  FOR EACH ROW EXECUTE FUNCTION wla_set_updated_at();

-- FK & よく使うクエリ用インデックス
CREATE INDEX idx_wla_attempts_athlete_id ON wla_attempts(athlete_id);
CREATE INDEX idx_wla_attempts_lookup
  ON wla_attempts(athlete_id, type, attempt_num);


-- ===========================================================================
-- 4. wla_session_state (大会進行のリアルタイム同期用)
-- ===========================================================================
-- シングルトン的なテーブル: 大会ごとに1行。
-- 複数端末で「現在誰が呼ばれていて、時計が何秒か」を同期する。
CREATE TABLE wla_session_state (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id      UUID NOT NULL REFERENCES wla_tournaments(id) UNIQUE,
  current_lifter_id  UUID REFERENCES wla_athletes(id),
  current_attempt_id UUID REFERENCES wla_attempts(id),
  clock_status       TEXT NOT NULL DEFAULT 'stopped'
                       CHECK (clock_status IN ('stopped', 'running')),
  clock_started_at   TIMESTAMPTZ,             -- 時計開始時刻
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);

CREATE TRIGGER wla_session_state_updated_at
  BEFORE UPDATE ON wla_session_state
  FOR EACH ROW EXECUTE FUNCTION wla_set_updated_at();

CREATE INDEX idx_wla_session_state_tournament_id
  ON wla_session_state(tournament_id);


-- ===========================================================================
-- 5. wla_master_records (CSV一括インポート用データ)
-- ===========================================================================
CREATE TABLE wla_master_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category   TEXT NOT NULL,                   -- 県記録, 高校記録, シンクレア係数 など
  data       JSONB NOT NULL DEFAULT '{}',     -- 各種データを柔軟に格納
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER wla_master_records_updated_at
  BEFORE UPDATE ON wla_master_records
  FOR EACH ROW EXECUTE FUNCTION wla_set_updated_at();

CREATE INDEX idx_wla_master_records_category ON wla_master_records(category);


-- ===========================================================================
-- 6. Row Level Security (RLS)
-- ===========================================================================
-- すべてのテーブルで RLS を有効化し、
-- user_metadata->>'source_app' = 'wla-app' のユーザーのみアクセスを許可する。
-- DELETE 権限は不要（論理削除を使用）。

-- Helper 式: auth.jwt() -> 'user_metadata' ->> 'source_app' = 'wla-app'
-- ---------------------------------------------------------------------------

-- ---- wla_tournaments ----
ALTER TABLE wla_tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY wla_tournaments_select ON wla_tournaments
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_tournaments_insert ON wla_tournaments
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_tournaments_update ON wla_tournaments
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );

-- ---- wla_athletes ----
ALTER TABLE wla_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY wla_athletes_select ON wla_athletes
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_athletes_insert ON wla_athletes
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_athletes_update ON wla_athletes
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );

-- ---- wla_attempts ----
ALTER TABLE wla_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY wla_attempts_select ON wla_attempts
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_attempts_insert ON wla_attempts
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_attempts_update ON wla_attempts
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );

-- ---- wla_session_state ----
ALTER TABLE wla_session_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY wla_session_state_select ON wla_session_state
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_session_state_insert ON wla_session_state
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_session_state_update ON wla_session_state
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );

-- ---- wla_master_records ----
ALTER TABLE wla_master_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY wla_master_records_select ON wla_master_records
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_master_records_insert ON wla_master_records
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );
CREATE POLICY wla_master_records_update ON wla_master_records
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'source_app')::text = 'wla-app'
  );


-- ===========================================================================
-- 7. Supabase Realtime 有効化
-- ===========================================================================
-- wla_session_state と wla_attempts をリアルタイム配信対象にする。
-- Supabase では publication に追加することで Realtime が有効になる。
ALTER PUBLICATION supabase_realtime ADD TABLE wla_session_state;
ALTER PUBLICATION supabase_realtime ADD TABLE wla_attempts;
