// Boat Captain: sail the sea, find sea creatures, load crates, and pick boat colours.
import { pickWeighted, shuffle, sumMastery, type Mastery } from "./adaptive";
import { COLORS, type CarColor } from "./content";

type Rng = () => number;

export type SeaWord = { id: string; emoji: string; ask: string; yes: string };

/** Sea words that already have "Find the ..." clips. */
const OLD: [string, string][] = [
  ["fish", "🐟"],
  ["boat", "⛵"],
];
/** Sea words recorded for this game: id, emoji, article. */
export const NEW_SEA = [
  { id: "whale", emoji: "🐳", a: "a" },
  { id: "crab", emoji: "🦀", a: "a" },
  { id: "shark", emoji: "🦈", a: "a" },
  { id: "octopus", emoji: "🐙", a: "an" },
  { id: "turtle", emoji: "🐢", a: "a" },
  { id: "dolphin", emoji: "🐬", a: "a" },
  { id: "anchor", emoji: "⚓", a: "an" },
  { id: "island", emoji: "🏝️", a: "an" },
  { id: "wave", emoji: "🌊", a: "a" },
  { id: "ship", emoji: "🚢", a: "a" },
  { id: "pufferfish", emoji: "🐡", a: "a" },
  { id: "penguin", emoji: "🐧", a: "a" },
] as const;

/** Easy ones first; the list unlocks from the front. */
export const SEA_WORDS: SeaWord[] = [
  ...OLD.slice(0, 1),
  ...NEW_SEA.slice(0, 2),
  ...OLD.slice(1),
  ...NEW_SEA.slice(2),
].map((w) => {
  const id = Array.isArray(w) ? w[0] : w.id;
  const emoji = Array.isArray(w) ? w[1] : w.emoji;
  const isNew = !Array.isArray(w);
  return {
    id,
    emoji,
    ask: isNew ? `bq_${id}` : `vp_${id}`,
    yes: isNew ? `by_${id}` : `vy_${id}`,
  };
});

export const BOAT_COLOR_KEYS = COLORS.map((c) => `bc_${c.name}`);
export const LOAD_MAX = 8;

export type SeaQuestion =
  | { kind: "find"; key: string; word: SeaWord; options: SeaWord[] }
  | { kind: "load"; key: string; n: number; crates: number }
  | { kind: "color"; key: string; color: CarColor; options: CarColor[] };

export type SeaLevel = {
  words: number;
  choices: number;
  loadMax: number;
  load: boolean;
  color: boolean;
};

export function seaLevel(m: Mastery): SeaLevel {
  const s = sumMastery(m);
  return {
    words: Math.min(SEA_WORDS.length, 5 + Math.floor(s / 2)),
    choices: s >= 12 ? 4 : 3,
    loadMax: Math.min(LOAD_MAX, 3 + Math.floor(s / 4)),
    load: s >= 4,
    color: s >= 8,
  };
}

export function makeSea(m: Mastery, prevKey?: string, rng: Rng = Math.random): SeaQuestion {
  const lvl = seaLevel(m);
  const r = rng();
  const kind = lvl.color && r < 0.2 ? "color" : lvl.load && r < 0.5 ? "load" : "find";
  if (kind === "load") {
    const ns = Array.from({ length: lvl.loadMax }, (_, i) => i + 1);
    const n = pickWeighted(
      ns,
      (x) => m[`l_${x}`] ?? 0,
      rng,
      (x) => `l_${x}` === prevKey,
    );
    return { kind, key: `l_${n}`, n, crates: Math.min(n + 3, 11) };
  }
  if (kind === "color") {
    const color = pickWeighted(
      COLORS,
      (c) => m[`c_${c.name}`] ?? 0,
      rng,
      (c) => `c_${c.name}` === prevKey,
    );
    const others = shuffle(
      COLORS.filter((c) => c.name !== color.name),
      rng,
    ).slice(0, lvl.choices - 1);
    return {
      kind,
      key: `c_${color.name}`,
      color,
      options: shuffle([color, ...others], rng),
    };
  }
  const pool = SEA_WORDS.slice(0, lvl.words);
  const word = pickWeighted(
    pool,
    (w) => m[`f_${w.id}`] ?? 0,
    rng,
    (w) => `f_${w.id}` === prevKey,
  );
  const others = shuffle(
    pool.filter((w) => w.id !== word.id),
    rng,
  ).slice(0, lvl.choices - 1);
  return { kind: "find", key: `f_${word.id}`, word, options: shuffle([word, ...others], rng) };
}
