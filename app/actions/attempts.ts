"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type Attempt = {
    id: string;
    athlete_id: string;
    type: "snatch" | "cj";
    attempt_num: number;
    declared_weight: number | null;
    status: "pending" | "success" | "fail" | "pass";
    changes_count: number;
    timer_started_at: string | null;
    is_first_attempt_lowered: boolean;
    created_at: string;
    updated_at: string;
};

/**
 * 大会に紐づく全試技記録を取得
 */
export async function getAttemptsByTournament(
    tournamentId: string
): Promise<Attempt[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("wla_attempts")
        .select("*, wla_athletes!inner(tournament_id)")
        .eq("wla_athletes.tournament_id", tournamentId)
        .is("deleted_at", null)
        .order("attempt_num", { ascending: true });

    if (error) throw new Error(error.message);

    // wla_athletes のネストを除去してフラットな Attempt を返す
    return (data ?? []).map(({ wla_athletes, ...attempt }) => attempt) as Attempt[];
}

/**
 * 選手の試技記録を取得
 */
export async function getAttemptsByAthlete(
    athleteId: string
): Promise<Attempt[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("wla_attempts")
        .select("*")
        .eq("athlete_id", athleteId)
        .is("deleted_at", null)
        .order("type")
        .order("attempt_num", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Attempt[];
}

/**
 * 試技記録を作成 or 更新（upsert）
 * athlete_id + type + attempt_num で一意
 */
export async function upsertAttempt(
    tournamentId: string,
    data: {
        athlete_id: string;
        type: "snatch" | "cj";
        attempt_num: number;
        declared_weight: number | null;
    }
) {
    const supabase = await createClient();

    // 既存レコードを検索
    const { data: existing } = await supabase
        .from("wla_attempts")
        .select("id, changes_count, declared_weight, status")
        .eq("athlete_id", data.athlete_id)
        .eq("type", data.type)
        .eq("attempt_num", data.attempt_num)
        .is("deleted_at", null)
        .single();

    if (existing) {
        // 既存レコードの更新（重量変更）
        const newChangesCount = existing.declared_weight !== data.declared_weight
            ? existing.changes_count + 1
            : existing.changes_count;

        if (newChangesCount > 2) {
            return { error: "重量変更は1試技につき2回までです" };
        }

        const { error } = await supabase
            .from("wla_attempts")
            .update({
                declared_weight: data.declared_weight,
                changes_count: newChangesCount,
            })
            .eq("id", existing.id);

        if (error) return { error: error.message };
    } else {
        // 新規レコード
        const { error } = await supabase.from("wla_attempts").insert({
            athlete_id: data.athlete_id,
            type: data.type,
            attempt_num: data.attempt_num,
            declared_weight: data.declared_weight,
            status: "pending",
            changes_count: 0,
        });

        if (error) return { error: error.message };
    }

    revalidatePath(`/tournaments/${tournamentId}/session`);
    return { success: true };
}

/**
 * 試技の判定を更新
 */
export async function judgeAttempt(
    tournamentId: string,
    attemptId: string,
    status: "success" | "fail" | "pass"
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("wla_attempts")
        .update({ status })
        .eq("id", attemptId);

    if (error) return { error: error.message };

    revalidatePath(`/tournaments/${tournamentId}/session`);
    return { success: true };
}
