"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Athlete } from "@/app/actions/athletes";
import type { Attempt } from "@/app/actions/attempts";
import { mergeAthletesWithAttempts, sortByLiftingOrder } from "@/lib/sorting";
import { GENDER_LABELS, type Gender } from "@/lib/constants";

type Props = {
    initialAthletes: Athlete[];
    initialAttempts: Attempt[];
    tournamentId: string;
    tournamentName: string;
};

type LiftType = "snatch" | "cj";

const TYPE_LABELS: Record<LiftType, string> = {
    snatch: "スナッチ",
    cj: "クリーン&ジャーク",
};

export default function ScoreboardView({
    initialAthletes,
    initialAttempts,
    tournamentId,
    tournamentName,
}: Props) {
    const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
    const [activeType, setActiveType] = useState<LiftType>("snatch");
    const [clock, setClock] = useState(new Date());

    // ポーリングで最新データを取得（5秒間隔）
    const fetchLatest = useCallback(async () => {
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from("wla_attempts")
                .select("*, wla_athletes!inner(tournament_id)")
                .eq("wla_athletes.tournament_id", tournamentId)
                .is("deleted_at", null)
                .order("attempt_num", { ascending: true });

            if (data) {
                const cleaned = data.map(
                    ({ wla_athletes, ...rest }) => rest
                ) as Attempt[];
                setAttempts(cleaned);
            }
        } catch {
            // silent fail for polling
        }
    }, [tournamentId]);

    useEffect(() => {
        const interval = setInterval(fetchLatest, 5000);
        return () => clearInterval(interval);
    }, [fetchLatest]);

    // 時計更新
    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const merged = useMemo(
        () => mergeAthletesWithAttempts(initialAthletes, attempts),
        [initialAthletes, attempts]
    );

    const sorted = useMemo(
        () => sortByLiftingOrder(merged, activeType),
        [merged, activeType]
    );

    // 現在のリフターと次の選手
    const pendingAthletes = sorted.filter((a) => {
        return a.attempts[activeType].some(
            (att) => !att || att.status === "pending"
        );
    });

    const currentLifter = pendingAthletes[0];
    const upcoming = pendingAthletes.slice(1, 6);

    // 現在のリフターの次の試技情報
    const getCurrentAttemptInfo = () => {
        if (!currentLifter) return null;
        const atts = currentLifter.attempts[activeType];
        for (let i = 0; i < 3; i++) {
            const a = atts[i];
            if (!a || a.status === "pending") {
                return {
                    num: i + 1,
                    weight: a?.declared_weight ??
                        (activeType === "snatch"
                            ? currentLifter.entry_snatch
                            : currentLifter.entry_cj),
                };
            }
        }
        return null;
    };

    const currentAttempt = getCurrentAttemptInfo();

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/[0.06]">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {tournamentName}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* Type switcher */}
                    <div className="flex gap-1 p-1 rounded-lg bg-slate-900/80 border border-white/[0.06]">
                        {(["snatch", "cj"] as LiftType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveType(t)}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer ${activeType === t
                                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900"
                                        : "text-slate-500 hover:text-white"
                                    }`}
                            >
                                {TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>
                    <span className="text-2xl font-bold text-white tabular-nums tracking-wider">
                        {clock.toLocaleTimeString("ja-JP")}
                    </span>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10">
                {currentLifter && currentAttempt ? (
                    <>
                        {/* Current lifter — hero */}
                        <div className="text-center mb-2">
                            <p className="text-sm font-medium text-amber-400 uppercase tracking-widest mb-3">
                                {TYPE_LABELS[activeType]} — {currentAttempt.num}回目
                            </p>
                            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight mb-3">
                                {currentLifter.name}
                            </h2>
                            <div className="flex items-center justify-center gap-4 text-base sm:text-lg text-slate-400">
                                {currentLifter.team && <span>{currentLifter.team}</span>}
                                <span className="text-slate-600">|</span>
                                <span>
                                    {currentLifter.gender
                                        ? GENDER_LABELS[currentLifter.gender as Gender]
                                        : ""}{" "}
                                    {currentLifter.weight_class}kg
                                </span>
                                {currentLifter.lot_number && (
                                    <>
                                        <span className="text-slate-600">|</span>
                                        <span>Lot {currentLifter.lot_number}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Weight display */}
                        <div className="my-8 sm:my-12">
                            <div className="relative">
                                <span className="text-8xl sm:text-[10rem] lg:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-orange-500 tabular-nums leading-none">
                                    {currentAttempt.weight ?? "—"}
                                </span>
                                <span className="absolute -right-10 sm:-right-14 bottom-4 sm:bottom-6 text-2xl sm:text-4xl font-bold text-slate-500">
                                    kg
                                </span>
                            </div>
                        </div>

                        {/* Past attempts for current lifter */}
                        <div className="flex items-center gap-3 mb-8">
                            {[0, 1, 2].map((i) => {
                                const a = currentLifter.attempts[activeType][i];
                                if (!a) return null;
                                return (
                                    <span
                                        key={i}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${a.status === "success"
                                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                                : a.status === "fail"
                                                    ? "bg-red-500/15 text-red-400 border-red-500/25 line-through"
                                                    : a.status === "pending"
                                                        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                                        : "bg-slate-800 text-slate-500 border-slate-700"
                                            }`}
                                    >
                                        {a.declared_weight ?? "—"}kg
                                    </span>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <p className="text-3xl sm:text-5xl font-bold text-slate-600">
                            {TYPE_LABELS[activeType]}
                        </p>
                        <p className="text-lg text-slate-700 mt-4">
                            全試技終了
                        </p>
                    </div>
                )}
            </div>

            {/* Upcoming bar */}
            {upcoming.length > 0 && (
                <div className="border-t border-white/[0.06] bg-slate-900/40 px-6 sm:px-10 py-4">
                    <p className="text-[11px] font-medium text-slate-600 uppercase tracking-widest mb-3">
                        Next Up
                    </p>
                    <div className="flex gap-4 overflow-x-auto">
                        {upcoming.map((athlete, i) => {
                            const atts = athlete.attempts[activeType];
                            let nextWeight: number | null = null;
                            let nextNum = 0;
                            for (let j = 0; j < 3; j++) {
                                const a = atts[j];
                                if (!a || a.status === "pending") {
                                    nextWeight =
                                        a?.declared_weight ??
                                        (activeType === "snatch"
                                            ? athlete.entry_snatch
                                            : athlete.entry_cj);
                                    nextNum = j + 1;
                                    break;
                                }
                            }

                            return (
                                <div
                                    key={athlete.id}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shrink-0 ${i === 0
                                            ? "border-amber-500/20 bg-amber-500/[0.04]"
                                            : "border-white/[0.04] bg-white/[0.01]"
                                        }`}
                                >
                                    <span className="text-xs font-bold text-slate-600 tabular-nums w-5">
                                        {i + 2}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {athlete.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {athlete.weight_class}kg
                                            {athlete.team ? ` · ${athlete.team}` : ""}
                                        </p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-lg font-bold text-amber-400 tabular-nums">
                                            {nextWeight ?? "—"}
                                            <span className="text-xs text-slate-600 ml-0.5">kg</span>
                                        </p>
                                        <p className="text-[10px] text-slate-600">
                                            {nextNum}回目
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
