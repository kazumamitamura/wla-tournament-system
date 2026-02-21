"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
    upsertAttempt,
    judgeAttempt,
    forceUpdateAttempt,
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
    Pencil,
    Shield,
} from "lucide-react";

type Props = {
    athlete: AthleteWithAttempts | null;
    type: "snatch" | "cj";
    tournamentId: string;
};

export default function AttemptPanel({ athlete, type, tournamentId }: Props) {
    if (!athlete) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mb-4">
                    <User className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">
                    左の表から選手を
                    <br />
                    選択してください
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
            <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-900/60">
                <h3 className="text-xl font-bold text-white mb-1">
                    {athlete.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {athlete.team && <span>{athlete.team}</span>}
                    <span className="text-slate-600">·</span>
                    <span>
                        {athlete.gender
                            ? GENDER_LABELS[athlete.gender as Gender]
                            : ""}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                        {athlete.weight_class}kg
                    </span>
                    {athlete.lot_number != null && (
                        <span className="text-slate-500">
                            Lot {athlete.lot_number}
                        </span>
                    )}
                </div>
            </div>

            {/* 3 attempt cards */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                {[0, 1, 2].map((i) => (
                    <AttemptCard
                        key={`${athlete.id}-${type}-${i}`}
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

// --- Attempt Card ---

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
    const [correctionMode, setCorrectionMode] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const isJudged = attempt && attempt.status !== "pending";
    const status = attempt?.status ?? "pending";

    // 自動フォーカス: changes_count === 1 の場合、次の(同じ)入力欄にフォーカス
    useEffect(() => {
        if (attempt && attempt.changes_count === 1 && !isJudged) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [attempt, isJudged]);

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
            const w = parseInt(weight, 10);
            if (!w || w <= 0) return;
            startTransition(async () => {
                const res = await upsertAttempt(tournamentId, {
                    athlete_id: athleteId,
                    type,
                    attempt_num: attemptNum,
                    declared_weight: w,
                });
                if (res.error) setError(res.error);
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

    // 修正モード：変更回数を無視して上書き
    const handleCorrection = () => {
        if (!attempt) return;
        const w = parseInt(weight, 10);
        if (!w || w <= 0) return;
        setError(null);
        startTransition(async () => {
            const result = await forceUpdateAttempt(tournamentId, attempt.id, {
                declared_weight: w,
                status: "pending", // ステータスも pending に戻す
            });
            if (result.error) {
                setError(result.error);
            } else {
                setCorrectionMode(false);
            }
        });
    };

    // --- status badge styles ---
    const statusBorderColor =
        status === "success"
            ? "border-emerald-500/30"
            : status === "fail"
                ? "border-red-500/30"
                : status === "pass"
                    ? "border-slate-600/30"
                    : "border-white/[0.08]";

    const statusBgColor =
        status === "success"
            ? "bg-emerald-900/15"
            : status === "fail"
                ? "bg-red-900/10"
                : status === "pass"
                    ? "bg-slate-800/30"
                    : "bg-slate-800/40";

    return (
        <div
            className={`rounded-xl border-2 p-5 transition-all ${statusBorderColor} ${statusBgColor}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-300">
                        {attemptNum}回目
                    </span>
                    {attempt && !isJudged && (
                        <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums ${attempt.changes_count >= 2
                                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                                    : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                                }`}
                        >
                            変更 {attempt.changes_count}/2
                        </span>
                    )}
                    {isJudged && (
                        <span
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${status === "success"
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

                {/* Correction button */}
                {attempt && (
                    <button
                        onClick={() => {
                            setCorrectionMode(!correctionMode);
                            if (!correctionMode) {
                                setWeight(attempt.declared_weight?.toString() ?? "");
                                setTimeout(() => {
                                    inputRef.current?.focus();
                                    inputRef.current?.select();
                                }, 50);
                            }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${correctionMode
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-slate-700/30 text-slate-500 border border-slate-600/20 hover:text-slate-300 hover:bg-slate-700/50"
                            }`}
                    >
                        <Pencil className="w-3 h-3" />
                        修正
                    </button>
                )}
            </div>

            {/* Weight input — large and touch-friendly */}
            <div className="mb-4">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="number"
                        inputMode="numeric"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        disabled={!!(isJudged && !correctionMode) || isPending}
                        onBlur={() => {
                            if (!correctionMode) handleWeightSave();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (correctionMode) {
                                    handleCorrection();
                                } else {
                                    handleWeightSave();
                                }
                            }
                        }}
                        placeholder="0"
                        className={`w-full rounded-xl border-2 px-5 py-4 text-center text-3xl font-black tabular-nums outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${correctionMode
                                ? "bg-orange-500/5 border-orange-500/40 text-orange-300 focus:ring-2 focus:ring-orange-500/30"
                                : isJudged
                                    ? status === "success"
                                        ? "bg-transparent border-transparent text-emerald-400"
                                        : status === "fail"
                                            ? "bg-transparent border-transparent text-red-400 line-through"
                                            : "bg-transparent border-transparent text-slate-500"
                                    : "bg-slate-900/60 border-slate-700/60 text-white focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20"
                            }`}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-600 pointer-events-none">
                        kg
                    </span>
                </div>
            </div>

            {/* Correction confirm button */}
            {correctionMode && (
                <div className="mb-4">
                    <button
                        onClick={handleCorrection}
                        disabled={!weight || isPending}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500/20 border-2 border-orange-500/30 px-4 py-3.5 text-sm font-bold text-orange-400 hover:bg-orange-500/30 transition-all disabled:opacity-30 cursor-pointer"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Shield className="w-4 h-4" />
                        )}
                        修正を確定（変更回数を無視）
                    </button>
                </div>
            )}

            {/* Judge buttons — large and touch-friendly */}
            {!isJudged && !correctionMode && (
                <div className="grid grid-cols-3 gap-2">
                    {isPending ? (
                        <div className="col-span-3 flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => handleJudge("success")}
                                disabled={!weight || isPending}
                                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/25 px-3 py-4 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-all disabled:opacity-30 cursor-pointer active:scale-95"
                            >
                                <Check className="w-6 h-6" strokeWidth={3} />
                                <span className="text-xs font-bold">成功</span>
                            </button>
                            <button
                                onClick={() => handleJudge("fail")}
                                disabled={!weight || isPending}
                                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-red-500/15 border-2 border-red-500/25 px-3 py-4 text-red-400 hover:bg-red-500/25 hover:border-red-500/40 transition-all disabled:opacity-30 cursor-pointer active:scale-95"
                            >
                                <X className="w-6 h-6" strokeWidth={3} />
                                <span className="text-xs font-bold">失敗</span>
                            </button>
                            <button
                                onClick={() => handleJudge("pass")}
                                disabled={isPending}
                                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-700/30 border-2 border-slate-600/30 px-3 py-4 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/30 transition-all disabled:opacity-30 cursor-pointer active:scale-95"
                            >
                                <SkipForward className="w-5 h-5" />
                                <span className="text-xs font-medium">パス</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
