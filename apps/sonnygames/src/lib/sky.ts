// Sky Pilot: fly the plane through the right ring, and learn which way is up, down, left and right.
import { pickWeighted, shuffle, sumMastery, type Mastery } from "./adaptive";
import { LETTER_ORDER } from "./content";

type Rng = () => number;

export const SKY_WORDS = [
  { id: "cloud", emoji: "☁️", a: "a" },
  { id: "sun", emoji: "☀️", a: "a" },
  { id: "bird", emoji: "🐦", a: "a" },
  { id: "balloon", emoji: "🎈", a: "a" },
  { id: "moon", emoji: "🌙", a: "a" },
  { id: "rocket", emoji: "🚀", a: "a" },
  { id: "kite", emoji: "🪁", a: "a" },
  { id: "rainbow", emoji: "🌈", a: "a" },
  { id: "helicopter", emoji: "🚁", a: "a" },
  { id: "star", emoji: "⭐", a: "a" },
] as const;
export type SkyWord = (typeof SKY_WORDS)[number];

export const SHAPES = ["circle", "square", "triangle", "heart", "star", "diamond"] as const;
export type Shape = (typeof SHAPES)[number];

export const DIRS = ["up", "down", "left", "right"] as const;
export type Dir = (typeof DIRS)[number];

/** What goes on a ring. */
export type Ring = { id: string; kind: "word" | "shape" | "number" | "letter"; value: string };

export type SkyQuestion =
  | {
      kind: "ring";
      what: Ring["kind"];
      key: string;
      answer: Ring;
      rings: Ring[];
    }
  | { kind: "dir"; key: string; dir: Dir; options: Dir[] };

export type SkyLevel = {
  rings: number;
  words: number;
  shapes: number;
  dirs: number;
  numberMax: number; // 0 = numbers not unlocked yet
  letters: number; // 0 = letters not unlocked yet
};

export function skyLevel(m: Mastery): SkyLevel {
  const s = sumMastery(m);
  return {
    rings: s >= 10 ? 4 : s >= 3 ? 3 : 2,
    words: Math.min(SKY_WORDS.length, 4 + Math.floor(s / 2)),
    shapes: Math.min(SHAPES.length, 3 + Math.floor(s / 3)),
    dirs: s >= 4 ? 4 : 2,
    numberMax: s >= 6 ? Math.min(10, 3 + Math.floor((s - 6) / 3)) : 0,
    letters: s >= 12 ? Math.min(26, 4 + Math.floor((s - 12) / 2)) : 0,
  };
}

export function makeSky(m: Mastery, prevKey?: string, rng: Rng = Math.random): SkyQuestion {
  const lvl = skyLevel(m);
  const kinds: (Ring["kind"] | "dir")[] = ["word", "shape", "dir"];
  if (lvl.numberMax) kinds.push("number");
  if (lvl.letters) kinds.push("letter");
  const kind = kinds[Math.floor(rng() * kinds.length)] ?? "word";

  if (kind === "dir") {
    const pool = DIRS.slice(0, lvl.dirs) as Dir[];
    const dir = pickWeighted(
      pool,
      (d) => m[`d_${d}`] ?? 0,
      rng,
      (d) => `d_${d}` === prevKey,
    );
    return { kind: "dir", key: `d_${dir}`, dir, options: pool };
  }

  let values: string[];
  let prefix: string;
  if (kind === "word") {
    values = SKY_WORDS.slice(0, lvl.words).map((w) => w.id);
    prefix = "w";
  } else if (kind === "shape") {
    values = SHAPES.slice(0, lvl.shapes) as unknown as string[];
    prefix = "s";
  } else if (kind === "number") {
    values = Array.from({ length: lvl.numberMax }, (_, i) => String(i + 1));
    prefix = "n";
  } else {
    values = LETTER_ORDER.slice(0, lvl.letters);
    prefix = "L";
  }
  const answerV = pickWeighted(
    values,
    (v) => m[`${prefix}_${v}`] ?? 0,
    rng,
    (v) => `${prefix}_${v}` === prevKey,
  );
  const others = shuffle(
    values.filter((v) => v !== answerV),
    rng,
  ).slice(0, lvl.rings - 1);
  const mk = (v: string): Ring => ({ id: `${prefix}_${v}`, kind, value: v });
  return {
    kind: "ring",
    what: kind,
    key: `${prefix}_${answerV}`,
    answer: mk(answerV),
    rings: shuffle([answerV, ...others].map(mk), rng),
  };
}
