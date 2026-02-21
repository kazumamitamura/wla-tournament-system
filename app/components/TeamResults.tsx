"use client";

import type { TeamScore } from "@/lib/calculations";
import { Trophy, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type Props = {
    teamScores: TeamScore[];
};

const PODIUM_STYLES: Record<number, { gradient: string; shadow: string; border: string }> = {
    0: {
        gradient: "from-amber-500 to-yellow-500",
        shadow: "shadow-amber-500/20",
        border: "border-amber-500/20",
    },
    1: {
        gradient: "from-slate-400 to-slate-300",
        shadow: "shadow-slate-400/15",
        border: "border-slate-400/15",
    },
    2: {
        gradient: "from-orange-600 to-orange-500",
        shadow: "shadow-orange-500/15",
        border: "border-orange-500/15",
    },
};

export default function TeamResults({ teamScores }: Props) {
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

    if (teamScores.length === 0) {
        return (
            <div className="text-center py-12 text-sm text-slate-500">
                団体得点の対象チームがありません
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                    <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">
                        学校対抗（団体成績）
                    </h3>
                    <p className="text-[11px] text-slate-500">
                        各チーム上位5名の合計得点
                    </p>
                </div>
            </div>

            {/* Team cards */}
            <div className="space-y-3">
                {teamScores.map((team, index) => {
                    const podium = PODIUM_STYLES[index];
                    const isExpanded = expandedTeam === team.team;

                    return (
                        <div
                            key={team.team}
                            className={`rounded-2xl border overflow-hidden transition-all ${podium
                                    ? `${podium.border} bg-slate-900/60`
                                    : "border-white/[0.06] bg-slate-900/40"
                                }`}
                        >
                            {/* Main row */}
                            <button
                                onClick={() =>
                                    setExpandedTeam(isExpanded ? null : team.team)
                                }
                                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Rank */}
                                    {podium ? (
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${podium.gradient} shadow-lg ${podium.shadow}`}
                                        >
                                            <Trophy className="h-5 w-5 text-white" />
                                        </div>
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-white/[0.06]">
                                            <span className="text-sm font-bold text-slate-400">
                                                {index + 1}
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-left">
                                        <p
                                            className={`text-sm font-bold ${index === 0
                                                    ? "text-amber-400"
                                                    : index <= 2
                                                        ? "text-white"
                                                        : "text-slate-300"
                                                }`}
                                        >
                                            {team.team}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            得点者: {team.allAthletePoints.length}名
                                            {team.allAthletePoints.length > 5 &&
                                                ` (上位5名を採用)`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-xl font-bold tabular-nums ${index === 0
                                                ? "text-amber-400"
                                                : index <= 2
                                                    ? "text-white"
                                                    : "text-slate-300"
                                            }`}
                                    >
                                        {team.totalPoints}
                                        <span className="text-xs font-normal text-slate-500 ml-1">
                                            pt
                                        </span>
                                    </span>
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    )}
                                </div>
                            </button>

                            {/* Expanded detail */}
                            {isExpanded && (
                                <div className="border-t border-white/[0.04] px-4 sm:px-5 py-3 bg-slate-900/30">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-slate-500">
                                                <th className="text-left font-medium py-1.5">選手</th>
                                                <th className="text-center font-medium py-1.5">階級</th>
                                                <th className="text-right font-medium py-1.5">得点</th>
                                                <th className="text-center font-medium py-1.5">採用</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.04]">
                                            {team.allAthletePoints.map((ap, i) => (
                                                <tr
                                                    key={`${ap.name}-${ap.weightClass}`}
                                                    className={
                                                        i >= 5 ? "opacity-40" : ""
                                                    }
                                                >
                                                    <td className="py-1.5 text-slate-300">{ap.name}</td>
                                                    <td className="py-1.5 text-center text-slate-400">
                                                        {ap.weightClass}kg
                                                    </td>
                                                    <td className="py-1.5 text-right tabular-nums text-slate-300">
                                                        {ap.points}pt
                                                    </td>
                                                    <td className="py-1.5 text-center">
                                                        {i < 5 ? (
                                                            <span className="text-emerald-400">✓</span>
                                                        ) : (
                                                            <span className="text-slate-600">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
