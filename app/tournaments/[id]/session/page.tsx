import { notFound } from "next/navigation";
import { getTournament } from "@/app/actions/tournaments";
import { getAthletes } from "@/app/actions/athletes";
import { getAttemptsByTournament } from "@/app/actions/attempts";
import SessionBoard from "@/app/components/SessionBoard";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function SessionPage({ params }: Props) {
    const { id } = await params;
    const tournament = await getTournament(id);

    if (!tournament) {
        notFound();
    }

    const [athletes, attempts] = await Promise.all([
        getAthletes(id),
        getAttemptsByTournament(id),
    ]);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Link
                        href={`/tournaments/${id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-400 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        大会詳細に戻る
                    </Link>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {tournament.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(tournament.date).toLocaleDateString("ja-JP")}
                        </div>
                        {tournament.venue && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {tournament.venue}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        競技進行中
                    </span>
                </div>
            </div>

            {/* Session Board */}
            <SessionBoard
                athletes={athletes}
                attempts={attempts}
                tournamentId={id}
            />
        </div>
    );
}
