import { createClient } from "@/utils/supabase/server";
import { Dumbbell, LogOut } from "lucide-react";
import OnlineStatus from "./OnlineStatus";
import { logout } from "@/app/actions/auth";

/**
 * 共通ヘッダー
 * - アプリ名
 * - オンライン/オフラインインジケーター
 * - ユーザー情報 + ログアウト
 */
export default async function Header() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return (
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo & App name */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                            <Dumbbell className="h-5 w-5 text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight text-white">
                                WLA Tournament
                            </h1>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                                Weightlifting Manager
                            </p>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-4">
                        <OnlineStatus />

                        <div className="hidden sm:block h-6 w-px bg-white/10" />

                        <div className="hidden sm:block text-right">
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">
                                {user.email}
                            </p>
                        </div>

                        <form action={logout}>
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white cursor-pointer"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">ログアウト</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    );
}
