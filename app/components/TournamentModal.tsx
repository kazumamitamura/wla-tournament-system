"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tournamentSchema, type TournamentFormData } from "@/lib/schemas";
import { createTournament } from "@/app/actions/tournaments";
import {
    X,
    Loader2,
    AlertCircle,
    Trophy,
    Calendar,
    MapPin,
} from "lucide-react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function TournamentModal({ isOpen, onClose }: Props) {
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TournamentFormData>({
        resolver: zodResolver(tournamentSchema),
    });

    const onSubmit = async (data: TournamentFormData) => {
        setServerError(null);
        setIsLoading(true);
        try {
            const result = await createTournament(data);
            if (result.error) {
                setServerError(result.error);
            } else {
                reset();
                onClose();
            }
        } catch {
            setServerError("大会の作成に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        setServerError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-slate-900 p-6 sm:p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                            <Trophy className="h-5 w-5 text-slate-900" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">新規大会作成</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {serverError && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 mb-5">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-400">{serverError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            大会名 <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="例: 第○○回 ○○県ウエイトリフティング選手権大会"
                                className={`w-full rounded-xl border bg-slate-800/50 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 ${errors.name
                                        ? "border-red-500/40 focus:ring-red-500/30"
                                        : "border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20"
                                    }`}
                                {...register("name")}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-xs text-red-400 mt-1.5">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            開催日 <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="date"
                                className={`w-full rounded-xl border bg-slate-800/50 pl-11 pr-4 py-3.5 text-sm text-white outline-none transition-all focus:ring-2 [color-scheme:dark] ${errors.date
                                        ? "border-red-500/40 focus:ring-red-500/30"
                                        : "border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20"
                                    }`}
                                {...register("date")}
                            />
                        </div>
                        {errors.date && (
                            <p className="text-xs text-red-400 mt-1.5">
                                {errors.date.message}
                            </p>
                        )}
                    </div>

                    {/* Venue */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            会場
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="例: ○○市体育館"
                                className="w-full rounded-xl border border-white/[0.08] bg-slate-800/50 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20"
                                {...register("venue")}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading ? "作成中..." : "大会を作成"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
