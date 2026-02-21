import { notFound } from "next/navigation";
import { getTournament } from "@/app/actions/tournaments";
import { getAthletes } from "@/app/actions/athletes";
import { getAttemptsByTournament } from "@/app/actions/attempts";
import ScoreboardView from "@/app/components/ScoreboardView";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function ScoreboardPage({ params }: Props) {
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
        <ScoreboardView
            initialAthletes={athletes}
            initialAttempts={attempts}
            tournamentId={id}
            tournamentName={tournament.name}
        />
    );
}
