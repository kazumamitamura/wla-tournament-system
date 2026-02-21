"use client";

import { useState, useMemo, useEffect } from "react";
import { mergeAthletesWithAttempts, sortByLiftingOrder } from "@/lib/sorting";
import AttemptPanel from "@/app/components/AttemptPanel";
import type { Athlete } from "@/app/actions/athletes";
import type { Attempt } from "@/app/actions/attempts";
import { GENDER_LABELS, type Gender } from "@/lib/constants";

type Props = {
    athletes: Athlete[];
    attempts: Attempt[];
    tournamentId: string;
};

type LiftType = "snatch" | "cj";

const TAB_CONFIG: { type: LiftType; label: string; shortLabel: string }[] = [
    { type: "snatch", label: "スナッチ", shortLabel: "SN" },
    { type: "cj", label: "クリーン&ジャーク", shortLabel: "C&J" },
];

const STATUS_CELL = {
    success: "bg-emerald-900/30 text-emerald-400 font-semibold",
    fail: "bg-red-900/20 text-red-400 line-through",
    pass: "text-slate-600",
    pending: "text-amber-300/70",
} as const;

export default function SessionBoard({
    athletes,
    attempts,
    tournamentId,
}: Props) {
    const [activeType, setActiveType] = useState<LiftType>("snatch");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const merged = useMemo(
        () => mergeAthletesWithAttempts(athletes, attempts),
        [athletes, attempts]
    );

    const sorted = useMemo(
        () => sortByLiftingOrder(merged, activeType),
        [merged, activeType]
    );

    // 現在のリフター（最初の未完了者）
    const currentLifterId = sorted.find((a) => {
        return a.attempts[activeType].some(
            (att) => !att || att.status === "pending"
        );
    })?.id;

    // 初期選択：現在のリフターを自動選択
    useEffect(() => {
        if (!selectedId && currentLifterId) {
            setSelectedId(currentLifterId);
        }
    }, [selectedId, currentLifterId]);

    const selectedAthlete = sorted.find((a) => a.id === selectedId) ?? null;

    const completedCount = sorted.filter((a) => {
        const atts = a.attempts[activeType];
        return atts.every((att) => att && att.status !== "pending");
    }).length;

    return (
        <div className="flex gap-0 h-[calc(100vh-140px)]">
            {/* === LEFT: Excel-like athlete table (70%) === */}
            <div className="flex-[7] flex flex-col min-w-0">
                {/* Tabs + stats */}
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/80 border border-white/[0.06]">
                        {TAB_CONFIG.map((tab) => (
                            <button
                                key={tab.type}
                                onClick={() => {
                                    setActiveType(tab.type);
                                    setSelectedId(null);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer ${activeType === tab.type
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.shortLabel}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                            全 <strong className="text-slate-300">{athletes.length}</strong>名
                        </span>
                        <span>
                            完了{" "}
                            <strong className="text-emerald-400">{completedCount}</strong>/
                            {athletes.length}
                        </span>
                    </div>
                </div>

                {/* Table container */}
                <div className="flex-1 overflow-auto rounded-lg border border-slate-700/60">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-800 text-slate-400">
                                <th className="text-center text-[11px] font-semibold px-2 py-2.5 border border-slate-700/60 w-8">
                                    #
                                </th>
                                <th className="text-left text-[11px] font-semibold px-3 py-2.5 border border-slate-700/60 min-w-[120px]">
                                    選手名
                                </th>
                                <th className="text-left text-[11px] font-semibold px-3 py-2.5 border border-slate-700/60 min-w-[80px]">
                                    所属
                                </th>
                                <th className="text-center text-[11px] font-semibold px-2 py-2.5 border border-slate-700/60 w-10">
                                    性
                                </th>
                                <th className="text-center text-[11px] font-semibold px-2 py-2.5 border border-slate-700/60 w-14">
                                    階級
                                </th>
                                <th className="text-center text-[11px] font-semibold px-2 py-2.5 border border-slate-700/60 w-10">
                                    Lot
                                </th>
                                <th className="text-center text-[11px] font-semibold px-2 py-2.5 border border-slate-700/60 w-16">
                                    1回目
                                </th>
                                <th className="text-center text-[11px] font-semibold px-2 py-2.5 border border-slate-700/60 w-16">
                                    2回目
                                </th>
                                <th className="text-center text-[11px] font-semibold px-2 py-2.5 border border-slate-700/60 w-16">
                                    3回目
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((athlete, index) => {
                                const isSelected = athlete.id === selectedId;
                                const isCurrent = athlete.id === currentLifterId;
                                const atts = athlete.attempts[activeType];
                                const allDone = atts.every(
                                    (a) => a && a.status !== "pending"
                                );

                                return (
                                    <tr
                                        key={athlete.id}
                                        onClick={() => setSelectedId(athlete.id)}
                                        className={`cursor-pointer transition-colors ${isSelected
                                            ? "bg-blue-500/15 hover:bg-blue-500/20"
                                            : isCurrent
                                                ? "bg-amber-500/[0.08] hover:bg-amber-500/[0.12]"
                                                : allDone
                                                    ? "bg-slate-900/30 hover:bg-slate-800/50"
                                                    : "bg-slate-900/60 hover:bg-slate-800/60"
                                            }`}
                                    >
                                        {/* Order number */}
                                        <td className="text-center text-xs tabular-nums px-2 py-2 border border-slate-700/40 text-slate-500">
                                            {isCurrent ? (
                                                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            ) : (
                                                index + 1
                                            )}
                                        </td>

                                        {/* Name */}
                                        <td
                                            className={`px-3 py-2 border border-slate-700/40 font-medium whitespace-nowrap ${isSelected ? "text-blue-300" : "text-white"
                                                }`}
                                        >
                                            {athlete.name}
                                        </td>

                                        {/* Team */}
                                        <td className="px-3 py-2 border border-slate-700/40 text-xs text-slate-400 truncate max-w-[120px]">
                                            {athlete.team || ""}
                                        </td>

                                        {/* Gender */}
                                        <td className="text-center px-2 py-2 border border-slate-700/40 text-xs text-slate-400">
                                            {athlete.gender
                                                ? GENDER_LABELS[athlete.gender as Gender]?.[0]
                                                : ""}
                                        </td>

                                        {/* Weight class */}
                                        <td className="text-center px-2 py-2 border border-slate-700/40 text-xs text-amber-400 font-medium tabular-nums">
                                            {athlete.weight_class}
                                        </td>

                                        {/* Lot */}
                                        <td className="text-center px-2 py-2 border border-slate-700/40 text-xs text-slate-500 tabular-nums">
                                            {athlete.lot_number ?? ""}
                                        </td>

                                        {/* 3 attempts */}
                                        {[0, 1, 2].map((i) => {
                                            const a = atts[i];
                                            const entryW =
                                                i === 0
                                                    ? activeType === "snatch"
                                                        ? athlete.entry_snatch
                                                        : athlete.entry_cj
                                                    : null;

                                            return (
                                                <td
                                                    key={i}
                                                    className={`text-center px-2 py-2 border border-slate-700/40 text-xs tabular-nums font-medium ${a
                                                        ? STATUS_CELL[
                                                        a.status as keyof typeof STATUS_CELL
                                                        ]
                                                        : "text-slate-600"
                                                        }`}
                                                >
                                                    {a?.declared_weight ??
                                                        (i === 0 && entryW ? (
                                                            <span className="text-slate-600 italic">
                                                                {entryW}
                                                            </span>
                                                        ) : (
                                                            ""
                                                        ))}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {sorted.length === 0 && (
                        <div className="text-center py-16 text-sm text-slate-500">
                            選手が登録されていません
                        </div>
                    )}
                </div>
            </div>

            {/* === RIGHT: Input panel (30%) === */}
            <div className="flex-[3] border-l border-slate-700/50 bg-slate-900/40 min-w-[280px] max-w-[360px]">
                <AttemptPanel
                    key={selectedId ?? "none"}
                    athlete={selectedAthlete}
                    type={activeType}
                    tournamentId={tournamentId}
                />
            </div>
        </div>
    );
}
