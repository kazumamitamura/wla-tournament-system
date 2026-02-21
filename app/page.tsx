import { createClient } from "@/utils/supabase/server";
import { Trophy, Users, ClipboardList, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cards = [
    {
      title: "大会管理",
      description: "大会の作成・編集・管理を行います",
      icon: Trophy,
      href: "/tournaments",
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/20",
    },
    {
      title: "選手管理",
      description: "選手の登録・編集を行います",
      icon: Users,
      href: "/athletes",
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20",
    },
    {
      title: "記録管理",
      description: "県記録・高校記録等のマスターデータ管理",
      icon: ClipboardList,
      href: "/records",
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          ダッシュボード
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          ようこそ、
          <span className="text-amber-400">{user?.email}</span> さん
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 transition-all hover:border-white/[0.12] hover:bg-slate-900/80 hover:shadow-xl"
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadow} mb-4`}
            >
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5">
              {card.title}
            </h3>
            <p className="text-sm text-slate-400">{card.description}</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-amber-400 transition-colors">
              <span>開く</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
