import { notFound } from "next/navigation";
import { getTournament } from "@/app/actions/tournaments";
import { getAthletes } from "@/app/actions/athletes";
import AthleteTable from "@/app/components/AthleteTable";
import {
    TOURNAMENT_STATUS_LABELS,
    TOURNAMENT_STATUS_COLORS,
    type TournamentStatus,
} from "@/lib/constants";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Play } from "lucide-react";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function TournamentDetailPage({ params }: Props) {
    const { id } = await params;
    const tournament = await getTournament(id);

    if (!tournament) {
        notFound();
    }

    const athletes = await getAthletes(id);
    const status = tournament.status as TournamentStatus;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Back link */}
            <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-400 transition-colors mb-6"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                大会一覧に戻る
            </Link>

            {/* Tournament Info */}
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {tournament.name}
                            </h2>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${TOURNAMENT_STATUS_COLORS[status] ||
                                    TOURNAMENT_STATUS_COLORS.planning
                                    }`}
                            >
                                {TOURNAMENT_STATUS_LABELS[status] || status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span>
                                    {new Date(tournament.date).toLocaleDateString("ja-JP", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                            {tournament.venue && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                    <span>{tournament.venue}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session link */}
                    <Link
                        href={`/tournaments/${id}/session`}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-110 whitespace-nowrap"
                    >
                        <Play className="w-4 h-4" />
                        競技進行画面
                    </Link>
                </div>
            </div>

            {/* Athletes */}
            <AthleteTable athletes={athletes} tournamentId={id} />
        </div>
    );
}
