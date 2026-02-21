import type { Athlete } from "@/app/actions/athletes";
import type { Attempt } from "@/app/actions/attempts";

export type AthleteWithAttempts = Athlete & {
    attempts: {
        snatch: (Attempt | null)[];
        cj: (Attempt | null)[];
    };
};

/**
 * 選手データに試技情報をマージする
 */
export function mergeAthletesWithAttempts(
    athletes: Athlete[],
    attempts: Attempt[]
): AthleteWithAttempts[] {
    return athletes.map((athlete) => {
        const athleteAttempts = attempts.filter(
            (a) => a.athlete_id === athlete.id
        );

        const snatch: (Attempt | null)[] = [null, null, null];
        const cj: (Attempt | null)[] = [null, null, null];

        athleteAttempts.forEach((a) => {
            if (a.type === "snatch" && a.attempt_num >= 1 && a.attempt_num <= 3) {
                snatch[a.attempt_num - 1] = a;
            } else if (a.type === "cj" && a.attempt_num >= 1 && a.attempt_num <= 3) {
                cj[a.attempt_num - 1] = a;
            }
        });

        return {
            ...athlete,
            attempts: { snatch, cj },
        };
    });
}

/**
 * IWFルールに基づく試技順ソート
 *
 * 優先順位:
 *   1. 次に挙げる重量（申告重量 or エントリー重量）が軽い順
 *   2. 試技回数が少ない順（1回目が2回目より先）
 *   3. 抽選番号 (lot_number) が若い順
 */
export function sortByLiftingOrder(
    athletes: AthleteWithAttempts[],
    type: "snatch" | "cj"
): AthleteWithAttempts[] {
    return [...athletes].sort((a, b) => {
        // 次に実施すべき試技を特定
        const aNext = getNextAttemptInfo(a, type);
        const bNext = getNextAttemptInfo(b, type);

        // 全試技終了者は後ろへ
        if (aNext.done && !bNext.done) return 1;
        if (!aNext.done && bNext.done) return -1;
        if (aNext.done && bNext.done) return 0;

        // 1. 申告重量（軽い順）
        if (aNext.weight !== bNext.weight) {
            return aNext.weight - bNext.weight;
        }

        // 2. 試技回数（少ない順）
        if (aNext.attemptNum !== bNext.attemptNum) {
            return aNext.attemptNum - bNext.attemptNum;
        }

        // 3. 抽選番号（若い順）
        const aLot = a.lot_number ?? 9999;
        const bLot = b.lot_number ?? 9999;
        return aLot - bLot;
    });
}

type NextAttemptInfo = {
    done: boolean;
    weight: number;
    attemptNum: number;
};

/**
 * 選手の「次の試技」情報を取得
 */
function getNextAttemptInfo(
    athlete: AthleteWithAttempts,
    type: "snatch" | "cj"
): NextAttemptInfo {
    const attempts = athlete.attempts[type];
    const entryWeight =
        type === "snatch" ? athlete.entry_snatch : athlete.entry_cj;

    for (let i = 0; i < 3; i++) {
        const attempt = attempts[i];
        if (!attempt || attempt.status === "pending") {
            // この試技がまだ未判定 or 未登録 → これが次の試技
            const weight = attempt?.declared_weight ?? entryWeight ?? 999;
            return { done: false, weight, attemptNum: i + 1 };
        }
    }

    // 全試技終了
    return { done: true, weight: 999, attemptNum: 4 };
}
