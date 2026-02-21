"use client";

import { useState } from "react";
import TournamentModal from "@/app/components/TournamentModal";
import type { Tournament } from "@/app/actions/tournaments";
import {
    TOURNAMENT_STATUS_LABELS,
    TOURNAMENT_STATUS_COLORS,
    type TournamentStatus,
} from "@/lib/constants";
import Link from "next/link";
import {
    Plus,
    Trophy,
    Calendar,
    MapPin,
    ArrowRight,
    Search,
} from "lucide-react";

type Props = {
    tournaments: Tournament[];
};

export default function TournamentList({ tournaments }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filtered = tournaments.filter(
        (t) =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            (t.venue && t.venue.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <>
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="大会名・会場で検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-slate-800/50 pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20"
                    />
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:brightness-110 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    新規大会作成
                </button>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 border border-white/[0.06] mb-4">
                        <Trophy className="h-7 w-7 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500">
                        {search
                            ? "該当する大会が見つかりません"
                            : "大会がまだ登録されていません"}
                    </p>
                    {!search && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
                        >
                            最初の大会を作成する →
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((tournament) => {
                        const status = tournament.status as TournamentStatus;
                        return (
                            <Link
                                key={tournament.id}
                                href={`/tournaments/${tournament.id}`}
                                className="group rounded-2xl border border-white/[0.06] bg-slate-900/50 p-5 transition-all hover:border-white/[0.12] hover:bg-slate-900/80 hover:shadow-xl"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 shrink-0">
                                        <Trophy className="h-5 w-5 text-slate-900" />
                                    </div>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${TOURNAMENT_STATUS_COLORS[status] || TOURNAMENT_STATUS_COLORS.planning}`}
                                    >
                                        {TOURNAMENT_STATUS_LABELS[status] || status}
                                    </span>
                                </div>

                                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 leading-snug">
                                    {tournament.name}
                                </h3>

                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>
                                            {new Date(tournament.date).toLocaleDateString("ja-JP", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    {tournament.venue && (
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="truncate">{tournament.venue}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-amber-400 transition-colors">
                                    <span>詳細を開く</span>
                                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            <TournamentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
