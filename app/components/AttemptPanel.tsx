"use client";

import { useState, useTransition } from "react";
import {
    upsertAttempt,
    judgeAttempt,
    type Attempt,
} from "@/app/actions/attempts";
import type { AthleteWithAttempts } from "@/lib/sorting";
import { GENDER_LABELS, type Gender } from "@/lib/constants";
import {
    Check,
    X,
    SkipForward,
    Loader2,
    AlertTriangle,
    User,
} from "lucide-react";

type Props = {
    athlete: AthleteWithAttempts | null;
    type: "snatch" | "cj";
    tournamentId: string;
};

const STATUS_BG = {
    success: "bg-emerald-500/15 border-emerald-500/30",
    fail: "bg-red-500/15 border-red-500/30",
    pass: "bg-slate-700/40 border-slate-600/30",
    pending: "bg-slate-800/50 border-white/[0.08]",
} as const;

const STATUS_TEXT = {
    success: "text-emerald-400",
    fail: "text-red-400 line-through",
    pass: "text-slate-500",
    pending: "text-white",
} as const;

export default function AttemptPanel({ athlete, type, tournamentId }: Props) {
    if (!athlete) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-14 h-14 rounded-xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mb-3">
                    <User className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">
                    左の表から選手を選択してください
                </p>
            </div>
        );
    }

    const attempts = athlete.attempts[type];
    const entryWeight =
        type === "snatch" ? athlete.entry_snatch : athlete.entry_cj;

    return (
        <div className="flex flex-col h-full">
            {/* Athlete header */}
            <div className="px-5 py-4 border-b border-slate-700/50">
                <h3 className="text-lg font-bold text-white mb-0.5">
                    {athlete.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    {athlete.team && <span>{athlete.team}</span>}
                    <span className="text-slate-600">·</span>
                    <span>
                        {athlete.gender
                            ? GENDER_LABELS[athlete.gender as Gender]
                            : ""}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/20">
                        {athlete.weight_class}kg
                    </span>
                    {athlete.lot_number && (
                        <span className="text-slate-500">
                            Lot {athlete.lot_number}
                        </span>
                    )}
                </div>
            </div>

            {/* 3 attempt cards */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {[0, 1, 2].map((i) => (
                    <AttemptCard
                        key={i}
                        attempt={attempts[i]}
                        attemptNum={i + 1}
                        athleteId={athlete.id}
                        type={type}
                        tournamentId={tournamentId}
                        entryWeight={i === 0 ? entryWeight : null}
                    />
                ))}
            </div>
        </div>
    );
}

// --- Attempt Card (single attempt) ---

type AttemptCardProps = {
    attempt: Attempt | null;
    attemptNum: number;
    athleteId: string;
    type: "snatch" | "cj";
    tournamentId: string;
    entryWeight: number | null;
};

function AttemptCard({
    attempt,
    attemptNum,
    athleteId,
    type,
    tournamentId,
    entryWeight,
}: AttemptCardProps) {
    const [weight, setWeight] = useState<string>(
        attempt?.declared_weight?.toString() ?? entryWeight?.toString() ?? ""
    );
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const isJudged = attempt && attempt.status !== "pending";
    const status = attempt?.status ?? "pending";

    const handleWeightSave = () => {
        const w = parseInt(weight, 10);
        if (!w || w <= 0) return;
        setError(null);
        startTransition(async () => {
            const result = await upsertAttempt(tournamentId, {
                athlete_id: athleteId,
                type,
                attempt_num: attemptNum,
                declared_weight: w,
            });
            if (result.error) setError(result.error);
        });
    };

    const handleJudge = (judgeStatus: "success" | "fail" | "pass") => {
        if (!attempt) {
            // 先に重量を登録
            const w = parseInt(weight, 10);
            if (!w || w <= 0) return;
            startTransition(async () => {
                const res = await upsertAttempt(tournamentId, {
                    athlete_id: athleteId,
                    type,
                    attempt_num: attemptNum,
                    declared_weight: w,
                });
                if (res.error) {
                    setError(res.error);
                    return;
                }
                // re-fetch してから judge (revalidate で取得)
            });
            return;
        }

        startTransition(async () => {
            const result = await judgeAttempt(
                tournamentId,
                attempt.id,
                judgeStatus
            );
            if (result.error) setError(result.error);
        });
    };

    return (
        <div
            className={`rounded-xl border p-4 transition-all ${STATUS_BG[status]}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {attemptNum}回目
                </span>
                {attempt && !isJudged && (
                    <span className="text-[10px] text-slate-500 tabular-nums">
                        変更 {attempt.changes_count}/2
                    </span>
                )}
                {isJudged && (
                    <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${status === "success"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : status === "fail"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-slate-600/20 text-slate-400"
                            }`}
                    >
                        {status === "success"
                            ? "成功 ○"
                            : status === "fail"
                                ? "失敗 ×"
                                : "パス"}
                    </span>
                )}
            </div>

            {/* Weight input */}
            <div className="flex items-center gap-2 mb-3">
                <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    disabled={!!isJudged || isPending}
                    onBlur={handleWeightSave}
                    onKeyDown={(e) => e.key === "Enter" && handleWeightSave()}
                    className={`flex-1 rounded-lg border px-3 py-3 text-center text-2xl font-bold tabular-nums outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isJudged
                            ? `bg-transparent border-transparent ${STATUS_TEXT[status]}`
                            : "bg-slate-900/50 border-slate-700 text-white focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20"
                        }`}
                />
                <span className="text-sm text-slate-500 font-medium">kg</span>
            </div>

            {/* Judge buttons */}
            {!isJudged && (
                <div className="grid grid-cols-3 gap-2">
                    {isPending ? (
                        <div className="col-span-3 flex items-center justify-center py-2">
                            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => handleJudge("success")}
                                disabled={!weight || isPending}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-3 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-all disabled:opacity-30 cursor-pointer"
                            >
                                <Check className="w-4 h-4" strokeWidth={3} />
                                成功
                            </button>
                            <button
                                onClick={() => handleJudge("fail")}
                                disabled={!weight || isPending}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/25 px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-30 cursor-pointer"
                            >
                                <X className="w-4 h-4" strokeWidth={3} />
                                失敗
                            </button>
                            <button
                                onClick={() => handleJudge("pass")}
                                disabled={isPending}
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-700/30 border border-slate-600/30 px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-700/50 transition-all disabled:opacity-30 cursor-pointer"
                            >
                                <SkipForward className="w-3.5 h-3.5" />
                                パス
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
