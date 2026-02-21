import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ用 Supabase クライアント。
 * セッション情報は localStorage に自動永続化される（Supabase 標準機能）。
 * → オフライン復帰時にもセッションをリストアできる。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
