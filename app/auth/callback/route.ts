import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * OAuth コールバックルート
 * Google認証後にSupabaseから返されるcodeをセッションに交換し、
 * source_app: 'wla-app' メタデータを付与してからダッシュボードへリダイレクト
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Server Component の場合は set できないが問題ない
                        }
                    },
                },
            }
        );

        // code → セッションに交換
        const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

        if (!exchangeError) {
            // ⚠️ 同居環境ルール: source_app メタデータを必ず付与
            // Google OAuth 初回ログイン時にはメタデータが無いため、ここで設定する
            await supabase.auth.updateUser({
                data: { source_app: "wla-app" },
            });

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // エラー時はログイン画面に戻す
    return NextResponse.redirect(`${origin}/login`);
}
