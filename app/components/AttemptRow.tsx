"use client";

import { useState, useTransition } from "react";
import { upsertAttempt, judgeAttempt, type Attempt } from "@/app/actions/attempts";
import type { AthleteWithAttempts } from "@/lib/sorting";
import { GENDER_LABELS, type Gender } from "@/lib/constants";
import {
    Check,
    X,
    SkipForward,
    Loader2,
    AlertTriangle,
} from "lucide-react";

type Props = {
    athlete: AthleteWithAttempts;
    type: "snatch" | "cj";
    tournamentId: string;
    isCurrentLifter: boolean;
};

const STATUS_STYLES = {
    success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    fail: "bg-red-500/20 text-red-400 border-red-500/30",
    pass: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
} as const;

const STATUS_LABELS = {
    success: "成功",
    fail: "失敗",
    pass: "パス",
    pending: "—",
} as const;

export default function AttemptRow({
    athlete,
    type,
    tournamentId,
    isCurrentLifter,
}: Props) {
    const attempts = athlete.attempts[type];
    const entryWeight = type === "snatch" ? athlete.entry_snatch : athlete.entry_cj;

    return (
        <tr
            className={`border-b border-white/[0.04] transition-colors ${isCurrentLifter
                    ? "bg-amber-500/[0.06] border-l-2 border-l-amber-400"
                    : "hover:bg-white/[0.02]"
                }`}
        >
            {/* Name & Info */}
            <td className="px-3 py-2.5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    {isCurrentLifter && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    <div>
                        <p className="text-sm font-medium text-white">{athlete.name}</p>
                        <p className="text-[11px] text-slate-500">
                            {athlete.team || ""}
                        </p>
                    </div>
                </div>
            </td>

            {/* Gender + Weight class */}
            <td className="px-3 py-2.5 text-center">
                <span className="text-xs text-slate-400">
                    {athlete.gender ? GENDER_LABELS[athlete.gender as Gender]?.[0] : ""}
                </span>
            </td>
            <td className="px-3 py-2.5 text-center">
                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {athlete.weight_class}kg
                </span>
            </td>

            {/* Lot */}
            <td className="px-3 py-2.5 text-center text-xs text-slate-500 tabular-nums">
                {athlete.lot_number ?? "—"}
            </td>

            {/* 3 attempts */}
            {[0, 1, 2].map((i) => (
                <AttemptCell
                    key={i}
                    attempt={attempts[i]}
                    attemptNum={i + 1}
                    athleteId={athlete.id}
                    type={type}
                    tournamentId={tournamentId}
                    entryWeight={entryWeight}
                />
            ))}
        </tr>
    );
}

// --- Individual Attempt Cell ---

type AttemptCellProps = {
    attempt: Attempt | null;
    attemptNum: number;
    athleteId: string;
    type: "snatch" | "cj";
    tournamentId: string;
    entryWeight: number | null;
};

function AttemptCell({
    attempt,
    attemptNum,
    athleteId,
    type,
    tournamentId,
    entryWeight,
}: AttemptCellProps) {
    const [weight, setWeight] = useState<string>(
        attempt?.declared_weight?.toString() ??
        (attemptNum === 1 ? entryWeight?.toString() ?? "" : "")
    );
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const isJudged = attempt && attempt.status !== "pending";
    const canChangeWeight = !isJudged && (attempt?.changes_count ?? 0) < 2;

    const handleWeightSubmit = () => {
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

    const handleJudge = (status: "success" | "fail" | "pass") => {
        if (!attempt) {
            // 先に重量を登録
            const w = parseInt(weight, 10);
            if (!w || w <= 0) return;
            startTransition(async () => {
                await upsertAttempt(tournamentId, {
                    athlete_id: athleteId,
                    type,
                    attempt_num: attemptNum,
                    declared_weight: w,
                });
            });
            return;
        }

        startTransition(async () => {
            const result = await judgeAttempt(tournamentId, attempt.id, status);
            if (result.error) setError(result.error);
        });
    };

    return (
        <td className="px-2 py-2.5">
            <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                {/* Weight input */}
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        disabled={!!isJudged || isPending}
                        onBlur={handleWeightSubmit}
                        onKeyDown={(e) => e.key === "Enter" && handleWeightSubmit()}
                        className={`w-16 rounded-lg border px-2 py-1.5 text-center text-sm font-semibold tabular-nums outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isJudged
                                ? attempt.status === "success"
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                    : attempt.status === "fail"
                                        ? "bg-red-500/10 border-red-500/30 text-red-400 line-through"
                                        : "bg-slate-800/50 border-slate-700 text-slate-500"
                                : "bg-slate-800/50 border-white/[0.08] text-white focus:ring-1 focus:border-amber-500/40 focus:ring-amber-500/20"
                            }`}
                    />
                    {attempt && !isJudged && (
                        <span className="text-[10px] text-slate-600 tabular-nums">
                            {attempt.changes_count}/2
                        </span>
                    )}
                </div>

                {/* Judge buttons or status badge */}
                {isJudged ? (
                    <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_STYLES[attempt.status]}`}
                    >
                        {STATUS_LABELS[attempt.status]}
                    </span>
                ) : (
                    <div className="flex items-center gap-1">
                        {isPending ? (
                            <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                        ) : (
                            <>
                                <button
                                    onClick={() => handleJudge("success")}
                                    disabled={!weight || isPending}
                                    className="rounded-md p-1 text-emerald-500 hover:bg-emerald-500/15 transition-colors disabled:opacity-30 cursor-pointer"
                                    title="成功"
                                >
                                    <Check className="w-4 h-4" strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => handleJudge("fail")}
                                    disabled={!weight || isPending}
                                    className="rounded-md p-1 text-red-500 hover:bg-red-500/15 transition-colors disabled:opacity-30 cursor-pointer"
                                    title="失敗"
                                >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                </button>
                                <button
                                    onClick={() => handleJudge("pass")}
                                    disabled={isPending}
                                    className="rounded-md p-1 text-slate-500 hover:bg-slate-500/15 transition-colors disabled:opacity-30 cursor-pointer"
                                    title="パス"
                                >
                                    <SkipForward className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Error tooltip */}
                {error && (
                    <div className="flex items-center gap-1 text-[10px] text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </td>
    );
}
