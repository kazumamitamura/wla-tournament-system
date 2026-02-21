"use client";

import { useState, useMemo } from "react";
import { mergeAthletesWithAttempts, sortByLiftingOrder } from "@/lib/sorting";
import AttemptRow from "@/app/components/AttemptRow";
import type { Athlete } from "@/app/actions/athletes";
import type { Attempt } from "@/app/actions/attempts";

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

export default function SessionBoard({
    athletes,
    attempts,
    tournamentId,
}: Props) {
    const [activeType, setActiveType] = useState<LiftType>("snatch");

    const merged = useMemo(
        () => mergeAthletesWithAttempts(athletes, attempts),
        [athletes, attempts]
    );

    const sorted = useMemo(
        () => sortByLiftingOrder(merged, activeType),
        [merged, activeType]
    );

    // 最初の未完了者が現在のリフター
    const currentLifterId = sorted.find((a) => {
        const atts = a.attempts[activeType];
        return atts.some((att) => !att || att.status === "pending");
    })?.id;

    return (
        <div>
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-slate-900/80 border border-white/[0.06] w-fit">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.type}
                        onClick={() => setActiveType(tab.type)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeType === tab.type
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.shortLabel}</span>
                    </button>
                ))}
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                <span>
                    全 <strong className="text-slate-300">{athletes.length}</strong> 選手
                </span>
                <span>
                    完了{" "}
                    <strong className="text-emerald-400">
                        {sorted.filter((a) => {
                            const atts = a.attempts[activeType];
                            return atts.every((att) => att && att.status !== "pending");
                        }).length}
                    </strong>
                    / {athletes.length}
                </span>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-white/[0.06]">
                                <th className="text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 min-w-[140px]">
                                    選手
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 w-10">
                                    性
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 w-16">
                                    階級
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-3 w-10">
                                    Lot
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-2 py-3">
                                    1回目
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-2 py-3">
                                    2回目
                                </th>
                                <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-2 py-3">
                                    3回目
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((athlete) => (
                                <AttemptRow
                                    key={athlete.id}
                                    athlete={athlete}
                                    type={activeType}
                                    tournamentId={tournamentId}
                                    isCurrentLifter={athlete.id === currentLifterId}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {sorted.length === 0 && (
                <div className="text-center py-16 text-sm text-slate-500">
                    選手が登録されていません。大会詳細画面から選手を追加してください。
                </div>
            )}
        </div>
    );
}
