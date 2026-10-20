// Question makers for Number Train (ages 3 to 6): what comes next, what is missing, before,
// and which number is bigger or smaller, growing from 1-5 up to 1-20.
import { pickWeighted, shuffle, sumMastery, type Mastery } from "./adaptive";

type Rng = () => number;
const randInt = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1));

export type NumQuestion =
  | { kind: "next"; seq: number[]; answer: number }
  | { kind: "missing"; seq: (number | null)[]; answer: number }
  | { kind: "before"; start: number; answer: number }
  | { kind: "big" | "small"; a: number; b: number; answer: number };

export type NumTier = 0 | 1 | 2 | 3;
export const NUM_TIER_STEPS = [6, 14, 26] as const;
export const NUM_TIER_NAMES = [
  "Numbers to 5",
  "Numbers to 10",
  "Bigger and smaller",
  "Numbers to 20",
] as const;

export function numTier(m: Mastery): NumTier {
  const s = sumMastery(m);
  return NUM_TIER_STEPS.reduce<number>((t, step) => (s >= step ? t + 1 : t), 0) as NumTier;
}

export const numKey = (q: NumQuestion) => `${q.kind}${q.answer}`;

export function makeNumber(
  tier: NumTier,
  m: Mastery,
  prev?: string,
  rng: Rng = Math.random,
): NumQuestion {
  const max = tier === 0 ? Math.min(5, 3 + Math.floor(sumMastery(m) / 3)) : tier <= 2 ? 10 : 20;
  const r = rng();
  const kind =
    tier === 0
      ? "next"
      : tier === 1
        ? r < 0.55
          ? "next"
          : "missing"
        : r < 0.3
          ? "next"
          : r < 0.5
            ? "missing"
            : r < 0.65
              ? "before"
              : r < 0.83
                ? "big"
                : "small";

  if (kind === "big" || kind === "small") {
    const a = randInt(1, max, rng);
    let b = randInt(1, max, rng);
    while (b === a) b = randInt(1, max, rng);
    return { kind, a, b, answer: kind === "big" ? Math.max(a, b) : Math.min(a, b) };
  }
  if (kind === "before") {
    const start = pickWeighted(
      Array.from({ length: max - 1 }, (_, i) => i + 2),
      (x) => m[`before${x - 1}`] ?? 0,
      rng,
      (x) => `before${x - 1}` === prev,
    );
    return { kind, start, answer: start - 1 };
  }
  // next / missing: a run of counting numbers
  const answer = pickWeighted(
    Array.from({ length: max - 2 }, (_, i) => i + 3),
    (x) => m[`${kind}${x}`] ?? 0,
    rng,
    (x) => `${kind}${x}` === prev,
  );
  if (kind === "next") {
    const len = Math.min(answer - 1, tier === 0 ? 3 : 4);
    return { kind, seq: Array.from({ length: len }, (_, i) => answer - len + i), answer };
  }
  const from = Math.max(1, answer - 2);
  const to = Math.min(max, answer + 1);
  const seq = Array.from({ length: to - from + 1 }, (_, i) =>
    from + i === answer ? null : from + i,
  );
  return { kind, seq, answer };
}

/** Three tiles: the answer plus two nearby wrong numbers. */
export function numOptions(answer: number, max: number, rng: Rng = Math.random): number[] {
  const near = [-2, -1, 1, 2]
    .map((d) => answer + d)
    .filter((x) => x >= 1 && x <= Math.max(max, answer + 1));
  return shuffle([answer, ...shuffle(near, rng).slice(0, 2)], rng);
}

