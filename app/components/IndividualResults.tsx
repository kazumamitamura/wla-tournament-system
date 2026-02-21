"use client";

import { useState } from "react";
import type { WeightClassResult } from "@/lib/calculations";
import { GENDER_LABELS, type Gender } from "@/lib/constants";
import { Trophy, Medal } from "lucide-react";

type Props = {
    weightClassResults: WeightClassResult[];
};

const RANK_STYLES: Record<number, string> = {
    1: "text-amber-400 font-bold",
    2: "text-slate-300 font-semibold",
    3: "text-orange-400 font-semibold",
};

const RANK_BADGE: Record<number, string> = {
    1: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    2: "bg-slate-400/15 text-slate-300 border-slate-400/25",
    3: "bg-orange-500/15 text-orange-400 border-orange-500/25",
};

export default function IndividualResults({ weightClassResults }: Props) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (weightClassResults.length === 0) {
        return (
            <div className="text-center py-12 text-sm text-slate-500">
                まだ記録がありません
            </div>
        );
    }

    const current = weightClassResults[selectedIndex];

    return (
        <div>
            {/* Weight class selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {weightClassResults.map((wcr, i) => (
                    <button
                        key={`${wcr.gender}-${wcr.weightClass}`}
                        onClick={() => setSelectedIndex(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${selectedIndex === i
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-slate-800/50 text-slate-400 border border-white/[0.06] hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        {GENDER_LABELS[wcr.gender as Gender]?.[0] ?? ""}{" "}
                        {wcr.weightClass}kg
                    </button>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                    <Trophy className="h-4 w-4 text-slate-900" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">
                        {GENDER_LABELS[current.gender as Gender] ?? current.gender}{" "}
                        {current.weightClass}kg級
                    </h3>
                    <p className="text-[11px] text-slate-500">
                        {current.athletes.length}名
                    </p>
                </div>
            </div>

            {/* Results table */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-white/[0.06]">
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 w-14">
                                    順位
                                </th>
                                <th className="text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    選手
                                </th>
                                <th className="text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    所属
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    SN 1
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    SN 2
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    SN 3
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 bg-blue-500/5">
                                    SN Best
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    C&J 1
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    C&J 2
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    C&J 3
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 bg-blue-500/5">
                                    C&J Best
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 bg-amber-500/5">
                                    トータル
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3">
                                    得点
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {current.athletes.map((ar) => (
                                <tr
                                    key={ar.athlete.id}
                                    className={`hover:bg-white/[0.02] transition-colors ${ar.rank && ar.rank <= 3 ? "bg-amber-500/[0.02]" : ""
                                        }`}
                                >
                                    {/* Rank */}
                                    <td className="px-3 py-3 text-center">
                                        {ar.rank ? (
                                            <span
                                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-xs font-bold ${RANK_BADGE[ar.rank] ??
                                                    "bg-slate-800/50 text-slate-400 border-white/[0.06]"
                                                    }`}
                                            >
                                                {ar.rank}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-600">—</span>
                                        )}
                                    </td>

                                    {/* Name */}
                                    <td className="px-3 py-3">
                                        <span
                                            className={`text-sm ${ar.rank && ar.rank <= 3 ? RANK_STYLES[ar.rank] : "text-white"}`}
                                        >
                                            {ar.athlete.name}
                                        </span>
                                    </td>

                                    {/* Team */}
                                    <td className="px-3 py-3 text-xs text-slate-400 truncate max-w-[120px]">
                                        {ar.athlete.team || "—"}
                                    </td>

                                    {/* Snatch attempts */}
                                    {[0, 1, 2].map((i) => (
                                        <td key={`sn-${i}`} className="px-3 py-3 text-center">
                                            <AttemptDisplay attempt={ar.snatchAttempts[i]} />
                                        </td>
                                    ))}

                                    {/* SN Best */}
                                    <td className="px-3 py-3 text-center bg-blue-500/5">
                                        <span className="text-sm font-semibold text-blue-400 tabular-nums">
                                            {ar.bestSnatch ?? "—"}
                                        </span>
                                    </td>

                                    {/* C&J attempts */}
                                    {[0, 1, 2].map((i) => (
                                        <td key={`cj-${i}`} className="px-3 py-3 text-center">
                                            <AttemptDisplay attempt={ar.cjAttempts[i]} />
                                        </td>
                                    ))}

                                    {/* C&J Best */}
                                    <td className="px-3 py-3 text-center bg-blue-500/5">
                                        <span className="text-sm font-semibold text-blue-400 tabular-nums">
                                            {ar.bestCJ ?? "—"}
                                        </span>
                                    </td>

                                    {/* Total */}
                                    <td className="px-3 py-3 text-center bg-amber-500/5">
                                        <span className="text-sm font-bold text-amber-400 tabular-nums">
                                            {ar.total ?? "—"}
                                        </span>
                                    </td>

                                    {/* Points */}
                                    <td className="px-3 py-3 text-center">
                                        {ar.points > 0 ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 tabular-nums">
                                                {ar.points}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-600">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Attempt display helper ---

import type { Attempt } from "@/app/actions/attempts";

function AttemptDisplay({ attempt }: { attempt: Attempt | null }) {
    if (!attempt || attempt.declared_weight == null) {
        return <span className="text-xs text-slate-600">—</span>;
    }

    if (attempt.status === "success") {
        return (
            <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                {attempt.declared_weight}
            </span>
        );
    }

    if (attempt.status === "fail") {
        return (
            <span className="text-xs font-medium text-red-400 line-through tabular-nums">
                {attempt.declared_weight}
            </span>
        );
    }

    if (attempt.status === "pass") {
        return (
            <span className="text-xs text-slate-500 tabular-nums">—</span>
        );
    }

    // pending
    return (
        <span className="text-xs text-slate-400 tabular-nums">
            {attempt.declared_weight}
        </span>
    );
}
