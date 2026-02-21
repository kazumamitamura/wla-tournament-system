"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { login } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Dumbbell, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

type LoginForm = {
    email: string;
    password: string;
};

export default function LoginPage() {
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        setServerError(null);
        setIsLoading(true);
        try {
            const result = await login(data);
            if (result?.error) {
                setServerError(result.error);
            }
        } catch {
            // redirect() throws NEXT_REDIRECT — this is expected
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setServerError(null);
        setIsGoogleLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) {
                setServerError(error.message);
                setIsGoogleLoading(false);
            }
        } catch {
            setServerError("Google認証中にエラーが発生しました");
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/8 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-lg px-4 sm:px-6">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/25 mb-5">
                        <Dumbbell className="w-8 h-8 text-slate-900" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        WLA Tournament
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        ウエイトリフティング大会運営システム
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/20">
                    <h2 className="text-lg font-semibold text-white mb-6">ログイン</h2>

                    {serverError && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 mb-5">
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-400">{serverError}</p>
                        </div>
                    )}

                    {/* Google OAuth */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading || isLoading}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-slate-800/50 px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:border-white/[0.15] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isGoogleLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        )}
                        {isGoogleLoading ? "接続中..." : "Googleでログイン"}
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.06]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-slate-900/60 px-3 text-xs text-slate-500">
                                または
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs font-medium text-slate-400 mb-2"
                            >
                                メールアドレス
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="example@email.com"
                                    className={`w-full rounded-xl border bg-slate-800/50 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 ${errors.email
                                            ? "border-red-500/40 focus:ring-red-500/30"
                                            : "border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20"
                                        }`}
                                    {...register("email", {
                                        required: "メールアドレスを入力してください",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "有効なメールアドレスを入力してください",
                                        },
                                    })}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-red-400 mt-1.5">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-medium text-slate-400 mb-2"
                            >
                                パスワード
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className={`w-full rounded-xl border bg-slate-800/50 pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:ring-2 ${errors.password
                                            ? "border-red-500/40 focus:ring-red-500/30"
                                            : "border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20"
                                        }`}
                                    {...register("password", {
                                        required: "パスワードを入力してください",
                                        minLength: {
                                            value: 6,
                                            message: "パスワードは6文字以上で入力してください",
                                        },
                                    })}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-400 mt-1.5">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || isGoogleLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            {isLoading ? "ログイン中..." : "メールアドレスでログイン"}
                        </button>
                    </form>

                    {/* Register link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            アカウントをお持ちでない方は{" "}
                            <Link
                                href="/register"
                                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                            >
                                新規登録
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
