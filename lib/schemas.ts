import { z } from "zod";

// --- Tournament ---
export const tournamentSchema = z.object({
    name: z.string().min(1, "大会名を入力してください"),
    date: z.string().min(1, "日付を入力してください"),
    venue: z.string().optional(),
});

export type TournamentFormData = z.infer<typeof tournamentSchema>;

// --- Athlete ---
export const athleteSchema = z.object({
    name: z.string().min(1, "選手名を入力してください"),
    team: z.string().optional(),
    gender: z.enum(["male", "female"], {
        message: "性別を選択してください",
    }),
    weight_class: z.string().min(1, "階級を選択してください"),
    body_weight: z.string().optional(),
    entry_snatch: z.string().optional(),
    entry_cj: z.string().optional(),
});

export type AthleteFormData = z.infer<typeof athleteSchema>;
