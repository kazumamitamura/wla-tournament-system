"use client";

import { useState } from "react";
import AthleteModal from "@/app/components/AthleteModal";
import { deleteAthlete, type Athlete } from "@/app/actions/athletes";
import { GENDER_LABELS, type Gender } from "@/lib/constants";
import { Plus, Pencil, Trash2, UserX, Search } from "lucide-react";

type Props = {
    athletes: Athlete[];
    tournamentId: string;
};

export default function AthleteTable({ athletes, tournamentId }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filtered = athletes.filter(
        (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            (a.team && a.team.toLowerCase().includes(search.toLowerCase()))
    );

    const handleEdit = (athlete: Athlete) => {
        setEditingAthlete(athlete);
        setIsModalOpen(true);
    };

    const handleDelete = async (athlete: Athlete) => {
        if (!confirm(`${athlete.name} を名簿から削除してもよろしいですか？`)) return;
        setDeletingId(athlete.id);
        await deleteAthlete(athlete.id, tournamentId);
        setDeletingId(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAthlete(null);
    };

    return (
        <>
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-white">
                        選手名簿
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-white/[0.06]">
                        {athletes.length}名
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="選手名・所属で検索..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-56 rounded-lg border border-white/[0.08] bg-slate-800/50 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none transition-all focus:ring-1 focus:border-amber-500/40 focus:ring-amber-500/20"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingAthlete(null);
                            setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:brightness-110 cursor-pointer whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        選手を追加
                    </button>
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/[0.06] bg-slate-900/30">
                    <UserX className="h-8 w-8 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-500">
                        {search
                            ? "該当する選手が見つかりません"
                            : "選手がまだ登録されていません"}
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-slate-900/80">
                                    <th className="text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                        所属
                                    </th>
                                    <th className="text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                        氏名
                                    </th>
                                    <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                        性別
                                    </th>
                                    <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                        階級
                                    </th>
                                    <th className="text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                        体重
                                    </th>
                                    <th className="text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                        SN
                                    </th>
                                    <th className="text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                                        C&J
                                    </th>
                                    <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-24">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filtered.map((athlete) => (
                                    <tr
                                        key={athlete.id}
                                        className={`hover:bg-white/[0.02] transition-colors ${deletingId === athlete.id ? "opacity-50" : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3 text-slate-400 truncate max-w-[140px]">
                                            {athlete.team || "—"}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                                            {athlete.name}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-400">
                                            {athlete.gender
                                                ? GENDER_LABELS[athlete.gender as Gender]
                                                : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {athlete.weight_class ? (
                                                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    {athlete.weight_class}kg
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                                            {athlete.body_weight ? `${athlete.body_weight}` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                                            {athlete.entry_snatch ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-300 tabular-nums">
                                            {athlete.entry_cj ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(athlete)}
                                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-amber-400 transition-colors cursor-pointer"
                                                    title="編集"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(athlete)}
                                                    disabled={deletingId === athlete.id}
                                                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                                    title="削除"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AthleteModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                tournamentId={tournamentId}
                editingAthlete={editingAthlete}
            />
        </>
    );
}
