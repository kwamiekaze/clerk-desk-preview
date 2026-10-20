// Question makers for the counting games. Pure functions so they are easy to test.
import { pickWeighted, shuffle, type Mastery } from "./adaptive";
import { COLORS, type CarColor } from "./content";

type Rng = () => number;

const randInt = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1));

export const pickColor = (rng: Rng = Math.random, not?: string): CarColor => {
  const pool = COLORS.filter((c) => c.name !== not);
  return pool[Math.floor(rng() * pool.length)] ?? (COLORS[0] as CarColor);
};

/** Pick a number to practise (1..max), favouring numbers that are less mastered. */
export function pickNumber(max: number, mastery: Mastery, prev?: number, rng: Rng = Math.random) {
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  return pickWeighted(
    nums,
    (n) => mastery[String(n)] ?? 0,
    rng,
    (n) => n === prev,
  );
}

/** Number tiles to choose from: the answer plus close wrong answers. */
export function numberOptions(answer: number, max: number, rng: Rng = Math.random): number[] {
  const pool = Array.from({ length: Math.min(10, max + 1) }, (_, i) => i + 1).filter(
    (x) => x !== answer,
  );
  const near = pool.sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer)).slice(0, 4);
  return shuffle([answer, ...shuffle(near, rng).slice(0, 2)], rng);
}

// ----- Parking Lot -----

export type ParkingQuestion = { n: number; bays: number; color: CarColor };

export function makeParking(max: number, mastery: Mastery, prev?: number, rng: Rng = Math.random) {
  const n = pickNumber(max, mastery, prev, rng);
  // More bays and cars than needed, so he has to count and stop at the right number.
  return { n, bays: Math.min(12, n + 3), color: pickColor(rng) } satisfies ParkingQuestion;
}

// ----- More Cars -----

export type CompareQuestion = {
  left: number;
  right: number;
  leftColor: CarColor;
  rightColor: CarColor;
  ask: "more" | "fewer";
};

/** The bigger side never has more than `max` cars. "Fewer" questions unlock a little later. */
export function makeCompare(
  max: number,
  allowFewer: boolean,
  rng: Rng = Math.random,
): CompareQuestion {
  const hi = Math.max(2, max);
  const a = randInt(1, hi, rng);
  let b = randInt(1, hi, rng);
  while (b === a) b = randInt(1, hi, rng);
  const leftColor = pickColor(rng);
  const rightColor = pickColor(rng, leftColor.name);
  const ask = allowFewer && rng() < 0.4 ? "fewer" : "more";
  return { left: a, right: b, leftColor, rightColor, ask };
}

export const compareAnswer = (q: CompareQuestion): "left" | "right" => {
  const leftWins = q.ask === "more" ? q.left > q.right : q.left < q.right;
  return leftWins ? "left" : "right";
};

// ----- Traffic Jam -----

export type TrafficCar = { color: CarColor; style: number };
export type TrafficQuestion = { n: number; target: CarColor; cars: TrafficCar[] };

/** A jam of mixed colours; he counts only the cars of the asked-for colour. */
export function makeTraffic(
  max: number,
  mastery: Mastery,
  prev?: number,
  rng: Rng = Math.random,
): TrafficQuestion {
  const n = pickNumber(max, mastery, prev, rng);
  const target = pickColor(rng);
  const otherColors = shuffle(
    COLORS.filter((c) => c.name !== target.name),
    rng,
  ).slice(0, max >= 6 ? 3 : 2);
  const others = Math.min(12 - n, randInt(2, 3 + Math.floor(max / 3), rng));
  const cars: TrafficCar[] = [
    ...Array.from({ length: n }, () => ({ color: target, style: randInt(0, 3, rng) })),
    ...Array.from({ length: others }, (_, i) => ({
      color: otherColors[i % otherColors.length] as CarColor,
      style: randInt(0, 3, rng),
    })),
  ];
  return { n, target, cars: shuffle(cars, rng) };
}
