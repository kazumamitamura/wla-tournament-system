import type { Athlete } from "@/app/actions/athletes";
import type { Attempt } from "@/app/actions/attempts";

// --- Types ---

export type AthleteResult = {
    athlete: Athlete;
    bestSnatch: number | null;
    bestCJ: number | null;
    total: number | null;
    rank: number | null;
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
// 1位=8pt, 2位=7pt, ... 8位=1pt. 9位以下=0pt
const POINTS_TABLE = [8, 7, 6, 5, 4, 3, 2, 1];
const TOP_N_FOR_TEAM = 5;

// --- Core Functions ---

/**
 * 選手の成功試技から最高記録を取得
 */
function getBestSuccessWeight(attempts: (Attempt | null)[]): number | null {
    let best: number | null = null;
    for (const a of attempts) {
        if (a && a.status === "success" && a.declared_weight != null) {
            if (best === null || a.declared_weight > best) {
                best = a.declared_weight;
            }
        }
    }
    return best;
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

/**
 * 全選手の個人成績を階級別にグループ化＆順位付け
 */
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
            const bestSnatch = getBestSuccessWeight(snatchAttempts);
            const bestCJ = getBestSuccessWeight(cjAttempts);

            // トータルはSNとC&Jの両方に有効記録がある場合のみ
            const total =
                bestSnatch != null && bestCJ != null ? bestSnatch + bestCJ : null;

            return {
                athlete,
                bestSnatch,
                bestCJ,
                total,
                rank: null,
                points: 0,
                snatchAttempts,
                cjAttempts,
            };
        });

        // ソート: トータル降順 → 抽選番号昇順
        athleteResults.sort((a, b) => {
            if (a.total === null && b.total === null) return 0;
            if (a.total === null) return 1;
            if (b.total === null) return -1;
            if (a.total !== b.total) return b.total - a.total;
            // 同重量の場合は抽選番号
            return (a.athlete.lot_number ?? 9999) - (b.athlete.lot_number ?? 9999);
        });

        // 順位とポイントを付与
        let rank = 1;
        for (let i = 0; i < athleteResults.length; i++) {
            const ar = athleteResults[i];
            if (ar.total === null) {
                ar.rank = null;
                ar.points = 0;
            } else {
                ar.rank = rank;
                ar.points = POINTS_TABLE[rank - 1] ?? 0;
                rank++;
            }
        }

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
 * 各チームの上位5名の得点合計
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
        // 得点降順ソート
        allAthletePoints.sort((a, b) => b.points - a.points);

        // 上位5名
        const topAthletes = allAthletePoints.slice(0, TOP_N_FOR_TEAM);
        const totalPoints = topAthletes.reduce((sum, a) => sum + a.points, 0);

        scores.push({ team, totalPoints, topAthletes, allAthletePoints });
    }

    // 総合得点降順
    scores.sort((a, b) => b.totalPoints - a.totalPoints);

    return scores;
}
