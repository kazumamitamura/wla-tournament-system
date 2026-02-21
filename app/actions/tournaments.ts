"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type Tournament = {
    id: string;
    name: string;
    date: string;
    venue: string | null;
    status: string;
    created_at: string;
};

/**
 * 大会一覧を取得
 */
export async function getTournaments(): Promise<Tournament[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("wla_tournaments")
        .select("*")
        .is("deleted_at", null)
        .order("date", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
}

/**
 * 大会を1件取得
 */
export async function getTournament(id: string): Promise<Tournament | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("wla_tournaments")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();

    if (error) return null;
    return data;
}

/**
 * 大会を作成
 */
export async function createTournament(formData: {
    name: string;
    date: string;
    venue?: string;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("wla_tournaments")
        .insert({
            name: formData.name,
            date: formData.date,
            venue: formData.venue || null,
            status: "planning",
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/");
    return { data };
}

/**
 * 大会を更新
 */
export async function updateTournament(
    id: string,
    formData: { name: string; date: string; venue?: string }
) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("wla_tournaments")
        .update({
            name: formData.name,
            date: formData.date,
            venue: formData.venue || null,
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath(`/tournaments/${id}`);
    return { success: true };
}
