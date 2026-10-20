// Question makers for the Ghost Game: counting, adding, taking away and comparing (ages 3 to 5).
import { pickWeighted, shuffle, sumMastery, type Mastery } from "./adaptive";

type Rng = () => number;
const randInt = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1));

export type GhostQuestion =
  | { kind: "count"; n: number }
  | { kind: "add"; a: number; b: number; n: number }
  | { kind: "sub"; total: number; gone: number; n: number }
  | { kind: "more"; left: number; right: number; n: number; answer: "left" | "right" };

export type GhostTier = 0 | 1 | 2 | 3 | 4;

/** Mastery points needed to reach tier 1, 2, 3 and 4. */
export const TIER_STEPS = [6, 14, 24, 36] as const;

/** 0: count to 3-5, 1: count to 10, 2: add to 6, 3: add to 10 and take away, 4: everything. */
export function ghostTier(m: Mastery): GhostTier {
  const s = sumMastery(m);
  return TIER_STEPS.reduce<number>((t, step) => (s >= step ? t + 1 : t), 0) as GhostTier;
}

export const TIER_NAMES = [
  "Counting to 5",
  "Counting to 10",
  "Adding",
  "Adding and taking away",
  "Ghost master",
] as const;

/** Mastery bucket key: one per kind and answer. */
export const ghostKey = (q: GhostQuestion) => `${q.kind}${q.n}`;

function countQuestion(tier: GhostTier, m: Mastery, prev: string | undefined, rng: Rng) {
  const lo = tier === 0 ? 1 : 3;
  const hi = tier === 0 ? Math.min(5, 3 + Math.floor(sumMastery(m) / 2)) : 10;
  const nums = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const n = pickWeighted(
    nums,
    (x) => m[`count${x}`] ?? 0,
    rng,
    (x) => `count${x}` === prev,
  );
  return { kind: "count", n } as const satisfies GhostQuestion;
}

function addQuestion(maxSum: number, m: Mastery, prev: string | undefined, rng: Rng) {
  const sums = Array.from({ length: maxSum - 1 }, (_, i) => i + 2);
  const n = pickWeighted(
    sums,
    (x) => m[`add${x}`] ?? 0,
    rng,
    (x) => `add${x}` === prev,
  );
  const a = randInt(1, n - 1, rng);
  return { kind: "add", a, b: n - a, n } as const satisfies GhostQuestion;
}

function subQuestion(maxTotal: number, m: Mastery, prev: string | undefined, rng: Rng) {
  const totals = Array.from({ length: maxTotal - 1 }, (_, i) => i + 2);
  const total = pickWeighted(
    totals,
    (x) => m[`sub${x}`] ?? 0,
    rng,
    (x) => `sub${x}` === prev,
  );
  const gone = randInt(1, total - 1, rng);
  return { kind: "sub", total, gone, n: total - gone } as const satisfies GhostQuestion;
}

function moreQuestion(rng: Rng) {
  const left = randInt(1, 10, rng);
  let right = randInt(1, 10, rng);
  while (right === left) right = randInt(1, 10, rng);
  return {
    kind: "more",
    left,
    right,
    n: Math.max(left, right),
    answer: left > right ? "left" : "right",
  } as const satisfies GhostQuestion;
}

/** Make one question for this tier, avoiding an immediate repeat of `prev` (a ghostKey). */
export function makeGhost(
  tier: GhostTier,
  m: Mastery,
  prev?: string,
  rng: Rng = Math.random,
): GhostQuestion {
  const r = rng();
  if (tier <= 1) return countQuestion(tier, m, prev, rng);
  if (tier === 2) return r < 0.6 ? addQuestion(6, m, prev, rng) : countQuestion(1, m, prev, rng);
  if (tier === 3) {
    if (r < 0.4) return addQuestion(10, m, prev, rng);
    if (r < 0.8) return subQuestion(7, m, prev, rng);
    return countQuestion(1, m, prev, rng);
  }
  if (r < 0.3) return addQuestion(10, m, prev, rng);
  if (r < 0.6) return subQuestion(10, m, prev, rng);
  if (r < 0.8) return moreQuestion(rng);
  return countQuestion(1, m, prev, rng);
}

/** Number tiles for the answer: the answer plus two close wrong ones. */
export function ghostOptions(answer: number, rng: Rng = Math.random): number[] {
  const hi = Math.max(5, Math.min(10, answer + 2));
  const near = Array.from({ length: hi }, (_, i) => i + 1)
    .filter((x) => x !== answer)
    .sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer))
    .slice(0, 4);
  return shuffle([answer, ...shuffle(near, rng).slice(0, 2)], rng);
}
