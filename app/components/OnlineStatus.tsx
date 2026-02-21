"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

/**
 * オンライン/オフラインインジケーター
 * navigator.onLine + イベントリスナーで通信状態をリアルタイム表示
 */
export default function OnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${isOnline
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse"
                }`}
        >
            {isOnline ? (
                <Wifi className="w-3.5 h-3.5" />
            ) : (
                <WifiOff className="w-3.5 h-3.5" />
            )}
            <span>{isOnline ? "オンライン" : "オフライン"}</span>
        </div>
    );
}
