"use client";

import { downloadResultsCSV } from "@/lib/csv-export";
import type { WeightClassResult } from "@/lib/calculations";
import { Download } from "lucide-react";

type Props = {
    weightClassResults: WeightClassResult[];
    tournamentName: string;
};

export default function CSVExportButton({
    weightClassResults,
    tournamentName,
}: Props) {
    return (
        <button
            onClick={() => downloadResultsCSV(weightClassResults, tournamentName)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white hover:border-white/[0.12] cursor-pointer"
        >
            <Download className="w-4 h-4" />
            CSVエクスポート
        </button>
    );
}
