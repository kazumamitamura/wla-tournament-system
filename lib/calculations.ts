import type { Athlete } from "@/app/actions/athletes";
import type { Attempt } from "@/app/actions/attempts";

// --- Types ---

export type AthleteResult = {
    athlete: Athlete;
    bestSnatch: number | null;
    bestCJ: number | null;
    total: number | null;
    snatchRank: number | null;
    cjRank: number | null;
    totalRank: number | null;
    points: number;
    snatchAttempts: (Attempt | null)[];
    cjAttempts: (Attempt | null)[];
};

export type WeightClassResult = {
    weightClass: string;
    gender: string;
    athletes: AthleteResult[];
};

export type TeamScore = {
    team: string;
    totalPoints: number;
    topAthletes: { name: string; weightClass: string; points: number }[];
    allAthletePoints: { name: string; weightClass: string; points: number }[];
};

// --- Points Table ---
const POINTS_TABLE = [8, 7, 6, 5, 4, 3, 2, 1];
const TOP_N_FOR_TEAM = 5;

// --- Helper: 成功試技から最高記録と達成情報を取得 ---

type BestLiftInfo = {
    weight: number;
    attemptNum: number;
    updatedAt: string;
} | null;

/**
 * 最高成功重量とその達成タイミングを取得
 * IWFタイブレーク: 同重量なら attempt_num が小さい → updated_at が早い方が上位
 */
function getBestLiftInfo(attempts: (Attempt | null)[]): BestLiftInfo {
    let best: BestLiftInfo = null;

    for (const a of attempts) {
        if (a && a.status === "success" && a.declared_weight != null) {
            if (
                best === null ||
                a.declared_weight > best.weight
            ) {
                best = {
                    weight: a.declared_weight,
                    attemptNum: a.attempt_num,
                    updatedAt: a.updated_at,
                };
            }
        }
    }
    return best;
}

function getBestWeight(attempts: (Attempt | null)[]): number | null {
    const info = getBestLiftInfo(attempts);
    return info?.weight ?? null;
}

/**
 * 試技データをマッピング
 */
function mapAttempts(
    attempts: Attempt[],
    athleteId: string,
    type: "snatch" | "cj"
): (Attempt | null)[] {
    const result: (Attempt | null)[] = [null, null, null];
    attempts
        .filter((a) => a.athlete_id === athleteId && a.type === type)
        .forEach((a) => {
            if (a.attempt_num >= 1 && a.attempt_num <= 3) {
                result[a.attempt_num - 1] = a;
            }
        });
    return result;
}

// --- IWF Tiebreak comparator ---

/**
 * IWFタイブレーク比較: 同重量の場合
 *  1. attempt_num が小さい方が上位（少ない試行回数で達成）
 *  2. updated_at が早い方が上位（先に達成）
 */
function compareTiebreak(
    a: BestLiftInfo,
    b: BestLiftInfo
): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    // 重量降順
    if (a.weight !== b.weight) return b.weight - a.weight;

    // 同重量 → attempt_num 昇順（少ない試行で達成した方が上位）
    if (a.attemptNum !== b.attemptNum) return a.attemptNum - b.attemptNum;

    // 同 attempt_num → updated_at 昇順（先に達成した方が上位）
    return a.updatedAt.localeCompare(b.updatedAt);
}

// --- Ranking helper ---

function assignRanks<T>(
    items: T[],
    getValue: (item: T) => BestLiftInfo
): Map<T, number | null> {
    const ranked = new Map<T, number | null>();

    // 有効記録のある選手と無い選手に分割
    const withValue = items.filter((it) => getValue(it) !== null);
    const withoutValue = items.filter((it) => getValue(it) === null);

    // ソート
    withValue.sort((a, b) => compareTiebreak(getValue(a), getValue(b)));

    // 順位割当
    let rank = 1;
    for (const item of withValue) {
        ranked.set(item, rank);
        rank++;
    }
    for (const item of withoutValue) {
        ranked.set(item, null);
    }

    return ranked;
}

// --- Main calculation ---

export function calculateIndividualResults(
    athletes: Athlete[],
    attempts: Attempt[]
): WeightClassResult[] {
    // 階級×性別でグループ化
    const groups = new Map<string, Athlete[]>();

    for (const athlete of athletes) {
        const key = `${athlete.gender ?? "unknown"}:${athlete.weight_class ?? "unknown"}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(athlete);
    }

    const results: WeightClassResult[] = [];

    for (const [key, groupAthletes] of groups) {
        const [gender, weightClass] = key.split(":");

        // 各選手の成績を計算
        const athleteResults: AthleteResult[] = groupAthletes.map((athlete) => {
            const snatchAttempts = mapAttempts(attempts, athlete.id, "snatch");
            const cjAttempts = mapAttempts(attempts, athlete.id, "cj");
            const bestSnatch = getBestWeight(snatchAttempts);
            const bestCJ = getBestWeight(cjAttempts);

            const total =
                bestSnatch != null && bestCJ != null ? bestSnatch + bestCJ : null;

            return {
                athlete,
                bestSnatch,
                bestCJ,
                total,
                snatchRank: null,
                cjRank: null,
                totalRank: null,
                points: 0,
                snatchAttempts,
                cjAttempts,
            };
        });

        // --- Snatch Rank ---
        const snatchRanks = assignRanks(
            athleteResults,
            (ar) => getBestLiftInfo(ar.snatchAttempts)
        );
        for (const [ar, rank] of snatchRanks) {
            ar.snatchRank = rank;
        }

        // --- C&J Rank ---
        const cjRanks = assignRanks(
            athleteResults,
            (ar) => getBestLiftInfo(ar.cjAttempts)
        );
        for (const [ar, rank] of cjRanks) {
            ar.cjRank = rank;
        }

        // --- Total Rank (tiebreak: C&J の最高記録達成情報) ---
        const totalRanks = assignRanks(
            athleteResults.filter((ar) => ar.total !== null),
            (ar) => {
                // total のソートは total 降順 → 同 total なら C&J 達成が早い方
                const cjInfo = getBestLiftInfo(ar.cjAttempts);
                if (ar.total === null || !cjInfo) return null;
                return {
                    weight: ar.total, // total を weight として扱う
                    attemptNum: cjInfo.attemptNum,
                    updatedAt: cjInfo.updatedAt,
                };
            }
        );
        for (const [ar, rank] of totalRanks) {
            ar.totalRank = rank;
        }
        // 記録なし者は null のまま

        // ポイントは Total Rank ベース
        for (const ar of athleteResults) {
            ar.points =
                ar.totalRank !== null ? (POINTS_TABLE[ar.totalRank - 1] ?? 0) : 0;
        }

        // 表示順: totalRank 昇順 → 記録なし者は末尾
        athleteResults.sort((a, b) => {
            if (a.totalRank === null && b.totalRank === null) return 0;
            if (a.totalRank === null) return 1;
            if (b.totalRank === null) return -1;
            return a.totalRank - b.totalRank;
        });

        results.push({ weightClass, gender, athletes: athleteResults });
    }

    // 階級でソート
    results.sort((a, b) => {
        if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
        const aNum = parseFloat(a.weightClass.replace("+", "")) || 999;
        const bNum = parseFloat(b.weightClass.replace("+", "")) || 999;
        return aNum - bNum;
    });

    return results;
}

/**
 * 団体得点（学校対抗）を計算
 */
export function calculateTeamScores(
    weightClassResults: WeightClassResult[]
): TeamScore[] {
    const teamMap = new Map<
        string,
        { name: string; weightClass: string; points: number }[]
    >();

    for (const wcr of weightClassResults) {
        for (const ar of wcr.athletes) {
            const team = ar.athlete.team;
            if (!team || ar.points === 0) continue;

            if (!teamMap.has(team)) teamMap.set(team, []);
            teamMap.get(team)!.push({
                name: ar.athlete.name,
                weightClass: wcr.weightClass,
                points: ar.points,
            });
        }
    }

    const scores: TeamScore[] = [];

    for (const [team, allAthletePoints] of teamMap) {
        allAthletePoints.sort((a, b) => b.points - a.points);
        const topAthletes = allAthletePoints.slice(0, TOP_N_FOR_TEAM);
        const totalPoints = topAthletes.reduce((sum, a) => sum + a.points, 0);
        scores.push({ team, totalPoints, topAthletes, allAthletePoints });
    }

    scores.sort((a, b) => b.totalPoints - a.totalPoints);
    return scores;
}
