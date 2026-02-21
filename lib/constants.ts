/**
 * IWF規定階級（2024年〜）
 */
export const WEIGHT_CLASSES = {
    male: ["55", "61", "67", "73", "81", "89", "96", "102", "109", "+109"],
    female: ["45", "49", "55", "59", "64", "71", "76", "81", "87", "+87"],
} as const;

export type Gender = "male" | "female";

export const GENDER_LABELS: Record<Gender, string> = {
    male: "男子",
    female: "女子",
};

export type TournamentStatus = "planning" | "ongoing" | "completed";

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
    planning: "準備中",
    ongoing: "開催中",
    completed: "終了",
};

export const TOURNAMENT_STATUS_COLORS: Record<TournamentStatus, string> = {
    planning: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    ongoing: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    completed: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};
