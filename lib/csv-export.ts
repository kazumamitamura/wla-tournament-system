import type { WeightClassResult } from "@/lib/calculations";
import { GENDER_LABELS, type Gender } from "@/lib/constants";

/**
 * 大会結果をCSVとしてダウンロード（BOM付きUTF-8）
 */
export function downloadResultsCSV(
    weightClassResults: WeightClassResult[],
    tournamentName: string
) {
    const BOM = "\uFEFF";

    const headers = [
        "階級",
        "性別",
        "総合順位",
        "氏名",
        "所属",
        "SN 1回目",
        "SN 1結果",
        "SN 2回目",
        "SN 2結果",
        "SN 3回目",
        "SN 3結果",
        "SN Best",
        "SN順位",
        "CJ 1回目",
        "CJ 1結果",
        "CJ 2回目",
        "CJ 2結果",
        "CJ 3回目",
        "CJ 3結果",
        "CJ Best",
        "CJ順位",
        "トータル",
        "得点",
    ];

    const rows: string[][] = [];

    for (const wcr of weightClassResults) {
        const genderLabel = GENDER_LABELS[wcr.gender as Gender] ?? wcr.gender;

        for (const ar of wcr.athletes) {
            const row: string[] = [
                `${wcr.weightClass}kg`,
                genderLabel,
                ar.totalRank?.toString() ?? "",
                ar.athlete.name,
                ar.athlete.team ?? "",
            ];

            // Snatch attempts
            for (let i = 0; i < 3; i++) {
                const a = ar.snatchAttempts[i];
                row.push(a?.declared_weight?.toString() ?? "");
                row.push(a ? statusLabel(a.status) : "");
            }
            row.push(ar.bestSnatch?.toString() ?? "");
            row.push(ar.snatchRank?.toString() ?? "");

            // C&J attempts
            for (let i = 0; i < 3; i++) {
                const a = ar.cjAttempts[i];
                row.push(a?.declared_weight?.toString() ?? "");
                row.push(a ? statusLabel(a.status) : "");
            }
            row.push(ar.bestCJ?.toString() ?? "");
            row.push(ar.cjRank?.toString() ?? "");

            row.push(ar.total?.toString() ?? "");
            row.push(ar.points > 0 ? ar.points.toString() : "");

            rows.push(row);
        }
    }

    const csvContent =
        BOM +
        [headers, ...rows]
            .map((row) =>
                row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
            )
            .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tournamentName}_結果.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function statusLabel(status: string): string {
    switch (status) {
        case "success":
            return "○";
        case "fail":
            return "×";
        case "pass":
            return "パス";
        default:
            return "";
    }
}
