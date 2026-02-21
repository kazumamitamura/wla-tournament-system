import { notFound } from "next/navigation";
import { getTournament } from "@/app/actions/tournaments";
import { getAthletes } from "@/app/actions/athletes";
import { getAttemptsByTournament } from "@/app/actions/attempts";
import {
    calculateIndividualResults,
    calculateTeamScores,
} from "@/lib/calculations";
import IndividualResults from "@/app/components/IndividualResults";
import TeamResults from "@/app/components/TeamResults";
import CSVExportButton from "@/app/components/CSVExportButton";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ResultsPage({ params }: Props) {
    const { id } = await params;
    const tournament = await getTournament(id);

    if (!tournament) {
        notFound();
    }

    const [athletes, attempts] = await Promise.all([
        getAthletes(id),
        getAttemptsByTournament(id),
    ]);

    const weightClassResults = calculateIndividualResults(athletes, attempts);
    const teamScores = calculateTeamScores(weightClassResults);

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/tournaments/${id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-400 transition-colors mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    大会詳細に戻る
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight mb-1">
                            {tournament.name} — 大会結果
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
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

                    <CSVExportButton
                        weightClassResults={weightClassResults}
                        tournamentName={tournament.name}
                    />
                </div>
            </div>

            {/* Team Scores */}
            <section className="mb-10">
                <TeamResults teamScores={teamScores} />
            </section>

            {/* Individual Results */}
            <section>
                <IndividualResults weightClassResults={weightClassResults} />
            </section>
        </div>
    );
}
