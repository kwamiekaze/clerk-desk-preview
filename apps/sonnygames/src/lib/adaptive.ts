import { LETTER_ORDER, WORDS, GARAGE, PEOPLE, type GarageCar } from "./content";

// Mastery is a small score per item: 0 (new) .. MAX_MASTERY (known well).
export const MAX_MASTERY = 5;

export type Mastery = Record<string, number>;

const sumCapped = (m: Mastery, cap: number) =>
  Object.values(m).reduce((s, v) => s + Math.min(Math.max(v, 0), cap), 0);

/** Total mastery points (each item counts up to 3). */
export const sumMastery = (m: Mastery) => sumCapped(m, 3);

/** Start with 4 letters (S-O-N-Y). Each 3 points of mastery unlocks one more. */
export function unlockedLetterCount(letters: Mastery): number {
  return Math.min(LETTER_ORDER.length, 8 + Math.floor(sumCapped(letters, 3) / 3));
}

/** Start with 3 words (CAR, BUS, SUN). Each 2 points unlocks one more. */
export function unlockedWordCount(words: Mastery): number {
  return Math.min(WORDS.length, 3 + Math.floor(sumCapped(words, 3) / 2));
}

/** Start with Mom, Dad, Sister and Mimi. Each 2 points unlocks one more person. */
export function unlockedPeopleCount(people: Mastery): number {
  return Math.min(PEOPLE.length, 4 + Math.floor(sumCapped(people, 3) / 2));
}

/** Count up to 3 at first, growing to 10. */
export function maxCountNumber(counting: Mastery): number {
  return Math.min(10, 3 + Math.floor(sumCapped(counting, 3) / 3));
}

/** Pick one item, favouring things that are less mastered. */
export function pickWeighted<T>(
  items: T[],
  mastery: (item: T) => number,
  rng: () => number = Math.random,
  exclude?: (item: T) => boolean,
): T {
  const pool = exclude && items.some((i) => !exclude(i)) ? items.filter((i) => !exclude(i)) : items;
  const weights = pool.map(
    (i) => 1 + (MAX_MASTERY - Math.min(Math.max(mastery(i), 0), MAX_MASTERY)),
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (const [i, item] of pool.entries()) {
    r -= weights[i] ?? 0;
    if (r <= 0) return item;
  }
  return pool[pool.length - 1] as T;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const ai = a[i] as T;
    a[i] = a[j] as T;
    a[j] = ai;
  }
  return a;
}

/** Wrap-around array access that always returns an item. */
export function at<T>(arr: T[], i: number): T {
  return arr[i % arr.length] as T;
}

/** Cars the child has unlocked with this many stars. */
export function unlockedCars(stars: number): GarageCar[] {
  return GARAGE.filter((c) => c.cost <= stars);
}

/** Cars newly unlocked when going from `before` to `after` stars. */
export function newlyUnlocked(before: number, after: number): GarageCar[] {
  return GARAGE.filter((c) => c.cost > before && c.cost <= after);
}

/** Stars for a finished round: 1 for finishing, +1 for a (nearly) perfect one. */
export function starsForRound(firstTryCorrect: number, total: number): number {
  return firstTryCorrect >= total - 1 ? 2 : 1;
}
