"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type Athlete = {
    id: string;
    tournament_id: string;
    name: string;
    team: string | null;
    gender: string | null;
    weight_class: string | null;
    body_weight: number | null;
    entry_snatch: number | null;
    entry_cj: number | null;
    lot_number: number | null;
    created_at: string;
};

/**
 * 大会に紐づく選手一覧を取得
 */
export async function getAthletes(tournamentId: string): Promise<Athlete[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("wla_athletes")
        .select("*")
        .eq("tournament_id", tournamentId)
        .is("deleted_at", null)
        .order("weight_class", { ascending: true })
        .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
}

/**
 * 選手を追加
 */
export async function createAthlete(
    tournamentId: string,
    formData: {
        name: string;
        team?: string;
        gender: string;
        weight_class: string;
        body_weight?: number;
        entry_snatch?: number;
        entry_cj?: number;
    }
) {
    const supabase = await createClient();
    const { error } = await supabase.from("wla_athletes").insert({
        tournament_id: tournamentId,
        name: formData.name,
        team: formData.team || null,
        gender: formData.gender,
        weight_class: formData.weight_class,
        body_weight: formData.body_weight ?? null,
        entry_snatch: formData.entry_snatch ?? null,
        entry_cj: formData.entry_cj ?? null,
    });

    if (error) return { error: error.message };

    revalidatePath(`/tournaments/${tournamentId}`);
    return { success: true };
}

/**
 * 選手を更新
 */
export async function updateAthlete(
    athleteId: string,
    tournamentId: string,
    formData: {
        name: string;
        team?: string;
        gender: string;
        weight_class: string;
        body_weight?: number;
        entry_snatch?: number;
        entry_cj?: number;
    }
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("wla_athletes")
        .update({
            name: formData.name,
            team: formData.team || null,
            gender: formData.gender,
            weight_class: formData.weight_class,
            body_weight: formData.body_weight ?? null,
            entry_snatch: formData.entry_snatch ?? null,
            entry_cj: formData.entry_cj ?? null,
        })
        .eq("id", athleteId);

    if (error) return { error: error.message };

    revalidatePath(`/tournaments/${tournamentId}`);
    return { success: true };
}

/**
 * 選手を論理削除
 */
export async function deleteAthlete(
    athleteId: string,
    tournamentId: string
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("wla_athletes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", athleteId);

    if (error) return { error: error.message };

    revalidatePath(`/tournaments/${tournamentId}`);
    return { success: true };
}
