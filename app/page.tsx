import { createClient } from "@/utils/supabase/server";
import { getTournaments } from "@/app/actions/tournaments";
import TournamentList from "@/app/components/TournamentList";
import { Trophy } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tournaments = await getTournaments();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white tracking-tight">
            大会管理
          </h2>
        </div>
        <p className="text-sm text-slate-400">
          ようこそ、
          <span className="text-amber-400">{user?.email}</span> さん
        </p>
      </div>

      <TournamentList tournaments={tournaments} />
    </div>
  );
}
