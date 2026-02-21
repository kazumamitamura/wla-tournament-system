"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { athleteSchema, type AthleteFormData } from "@/lib/schemas";
import { createAthlete, updateAthlete, type Athlete } from "@/app/actions/athletes";
import {
    WEIGHT_CLASSES,
    GENDER_LABELS,
    type Gender,
} from "@/lib/constants";
import {
    X,
    Loader2,
    AlertCircle,
    User,
    Users,
    Weight,
} from "lucide-react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    editingAthlete?: Athlete | null;
};

export default function AthleteModal({
    isOpen,
    onClose,
    tournamentId,
    editingAthlete,
}: Props) {
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<AthleteFormData>({
        resolver: zodResolver(athleteSchema),
        defaultValues: {
            gender: undefined,
            weight_class: "",
        },
    });

    const selectedGender = watch("gender") as Gender | undefined;

    // 編集モード時にフォームを初期化
    useEffect(() => {
        if (editingAthlete && isOpen) {
            reset({
                name: editingAthlete.name,
                team: editingAthlete.team || "",
                gender: editingAthlete.gender as Gender,
                weight_class: editingAthlete.weight_class || "",
                body_weight: editingAthlete.body_weight?.toString() ?? "",
                entry_snatch: editingAthlete.entry_snatch?.toString() ?? "",
                entry_cj: editingAthlete.entry_cj?.toString() ?? "",
            });
        } else if (isOpen) {
            reset({
                name: "",
                team: "",
                gender: undefined,
                weight_class: "",
                body_weight: "",
                entry_snatch: "",
                entry_cj: "",
            });
        }
    }, [editingAthlete, isOpen, reset]);

    // 性別が変わったら階級をリセット
    useEffect(() => {
        if (!editingAthlete) {
            setValue("weight_class", "");
        }
    }, [selectedGender, setValue, editingAthlete]);

    const onSubmit = async (data: AthleteFormData) => {
        setServerError(null);
        setIsLoading(true);
        try {
            const payload = {
                name: data.name,
                team: data.team,
                gender: data.gender,
                weight_class: data.weight_class,
                body_weight: data.body_weight ? parseFloat(data.body_weight) : undefined,
                entry_snatch: data.entry_snatch ? parseInt(data.entry_snatch, 10) : undefined,
                entry_cj: data.entry_cj ? parseInt(data.entry_cj, 10) : undefined,
            };

            const result = editingAthlete
                ? await updateAthlete(editingAthlete.id, tournamentId, payload)
                : await createAthlete(tournamentId, payload);

            if (result.error) {
                setServerError(result.error);
            } else {
                reset();
                onClose();
            }
        } catch {
            setServerError("選手の保存に失敗しました");
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

    const weightClasses = selectedGender
        ? WEIGHT_CLASSES[selectedGender]
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-slate-900 p-6 sm:p-8 shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">
                            {editingAthlete ? "選手を編集" : "選手を追加"}
                        </h2>
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            選手名 <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="山田 太郎"
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

                    {/* Team */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            所属
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="○○高校 / ○○大学"
                                className="w-full rounded-xl border border-white/[0.08] bg-slate-800/50 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20"
                                {...register("team")}
                            />
                        </div>
                    </div>

                    {/* Gender & Weight Class Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Gender */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                性別 <span className="text-red-400">*</span>
                            </label>
                            <select
                                className={`w-full rounded-xl border bg-slate-800/50 px-4 py-3.5 text-sm text-white outline-none transition-all focus:ring-2 appearance-none cursor-pointer ${errors.gender
                                        ? "border-red-500/40 focus:ring-red-500/30"
                                        : "border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20"
                                    }`}
                                {...register("gender")}
                            >
                                <option value="">選択</option>
                                {(Object.entries(GENDER_LABELS) as [Gender, string][]).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                            {errors.gender && (
                                <p className="text-xs text-red-400 mt-1.5">
                                    {errors.gender.message}
                                </p>
                            )}
                        </div>

                        {/* Weight Class */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                階級 <span className="text-red-400">*</span>
                            </label>
                            <select
                                className={`w-full rounded-xl border bg-slate-800/50 px-4 py-3.5 text-sm text-white outline-none transition-all focus:ring-2 appearance-none cursor-pointer ${errors.weight_class
                                        ? "border-red-500/40 focus:ring-red-500/30"
                                        : "border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20"
                                    }`}
                                disabled={!selectedGender}
                                {...register("weight_class")}
                            >
                                <option value="">
                                    {selectedGender ? "選択" : "性別を先に選択"}
                                </option>
                                {weightClasses.map((wc) => (
                                    <option key={wc} value={wc}>
                                        {wc}kg
                                    </option>
                                ))}
                            </select>
                            {errors.weight_class && (
                                <p className="text-xs text-red-400 mt-1.5">
                                    {errors.weight_class.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Body Weight */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">
                            検量体重 (kg)
                        </label>
                        <div className="relative">
                            <Weight className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="例: 72.50"
                                className="w-full rounded-xl border border-white/[0.08] bg-slate-800/50 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                {...register("body_weight")}
                            />
                        </div>
                    </div>

                    {/* Entry Weights Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Entry Snatch */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                エントリーSN (kg)
                            </label>
                            <input
                                type="number"
                                placeholder="例: 85"
                                className="w-full rounded-xl border border-white/[0.08] bg-slate-800/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                {...register("entry_snatch")}
                            />
                        </div>

                        {/* Entry C&J */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                エントリーC&J (kg)
                            </label>
                            <input
                                type="number"
                                placeholder="例: 110"
                                className="w-full rounded-xl border border-white/[0.08] bg-slate-800/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 focus:border-amber-500/40 focus:ring-amber-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                {...register("entry_cj")}
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
                            {isLoading
                                ? "保存中..."
                                : editingAthlete
                                    ? "更新"
                                    : "追加"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
