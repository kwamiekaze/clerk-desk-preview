// Question makers for Pattern Parade (ages 3 to 6): finish the colour pattern.
import { COLORS } from "./content";
import { shuffle, sumMastery, type Mastery } from "./adaptive";

type Rng = () => number;

export type PatternQuestion = {
  unit: string; // e.g. "AB", "AAB"
  seq: string[]; // colour names shown
  answer: string; // colour name
  options: string[];
};

export type PatternTier = 0 | 1 | 2 | 3;
export const PATTERN_TIER_STEPS = [5, 12, 22] as const;
export const PATTERN_TIER_NAMES = [
  "Two colours",
  "Longer patterns",
  "Three colours",
  "Pattern master",
] as const;

export function patternTier(m: Mastery): PatternTier {
  const s = sumMastery(m);
  return PATTERN_TIER_STEPS.reduce<number>((t, step) => (s >= step ? t + 1 : t), 0) as PatternTier;
}

const UNITS: Record<PatternTier, string[]> = {
  0: ["AB"],
  1: ["AB", "AAB", "ABB"],
  2: ["ABC", "AAB", "ABB", "ABC"],
  3: ["ABC", "AABB", "ABAC", "AABC", "ABCC"],
};

export function makePattern(
  tier: PatternTier,
  prevUnit?: string,
  rng: Rng = Math.random,
): PatternQuestion {
  const pool = UNITS[tier].filter((u) => u !== prevUnit);
  const unit =
    (pool.length ? pool : UNITS[tier])[Math.floor(rng() * (pool.length || UNITS[tier].length))] ??
    "AB";
  const letters = [...new Set(unit.split(""))];
  const colors = shuffle(
    COLORS.map((c) => c.name),
    rng,
  );
  const map = Object.fromEntries(letters.map((l, i) => [l, colors[i] ?? "red"]));
  const full: string[] = [];
  const reps = 3;
  for (let r = 0; r <= reps; r++) for (const l of unit) full.push(map[l] as string);
  // show enough to reveal the rule, hide the next one
  const shown = unit.length === 2 ? 4 : unit.length * 2 - 1;
  const seq = full.slice(0, shown);
  const answer = full[shown] as string;
  const others = colors.filter((c) => c !== answer).slice(0, 2);
  // make sure a wrong option is also one of the pattern's colours (a good distractor)
  const distract = Object.values(map).find((c) => c !== answer);
  const wrong = distract ? [distract, others.find((c) => c !== distract) ?? "red"] : others;
  return { unit, seq, answer, options: shuffle([answer, ...wrong], rng) };
}

