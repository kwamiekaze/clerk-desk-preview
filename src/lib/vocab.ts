// Word games for ages 3 to 6: picture words, sorting, opposites, rhymes and a find-it-on-Sonny game.
import { pickWeighted, shuffle, sumMastery, type Mastery } from "./adaptive";

type Rng = () => number;

export type Cat = "animal" | "food" | "vehicle" | "body" | "clothes" | "outside" | "thing";

export type VWord = { id: string; emoji: string; cat: Cat };

/** Easy first: the order here is the order words unlock in Picture Words. */
export const VWORDS: VWord[] = [
  { id: "dog", emoji: "🐶", cat: "animal" },
  { id: "cat", emoji: "🐱", cat: "animal" },
  { id: "apple", emoji: "🍎", cat: "food" },
  { id: "car", emoji: "🚗", cat: "vehicle" },
  { id: "ball", emoji: "⚽", cat: "thing" },
  { id: "sun", emoji: "☀️", cat: "outside" },
  { id: "banana", emoji: "🍌", cat: "food" },
  { id: "fish", emoji: "🐟", cat: "animal" },
  { id: "bus", emoji: "🚌", cat: "vehicle" },
  { id: "star", emoji: "⭐", cat: "outside" },
  { id: "cow", emoji: "🐮", cat: "animal" },
  { id: "pizza", emoji: "🍕", cat: "food" },
  { id: "hat", emoji: "🧢", cat: "clothes" },
  { id: "tree", emoji: "🌳", cat: "outside" },
  { id: "duck", emoji: "🦆", cat: "animal" },
  { id: "boat", emoji: "⛵", cat: "vehicle" },
  { id: "moon", emoji: "🌙", cat: "outside" },
  { id: "cookie", emoji: "🍪", cat: "food" },
  { id: "pig", emoji: "🐷", cat: "animal" },
  { id: "shoe", emoji: "👟", cat: "clothes" },
  { id: "house", emoji: "🏠", cat: "outside" },
  { id: "train", emoji: "🚂", cat: "vehicle" },
  { id: "bird", emoji: "🐦", cat: "animal" },
  { id: "book", emoji: "📖", cat: "thing" },
  { id: "milk", emoji: "🥛", cat: "food" },
  { id: "shirt", emoji: "👕", cat: "clothes" },
  { id: "flower", emoji: "🌸", cat: "outside" },
  { id: "truck", emoji: "🚚", cat: "vehicle" },
  { id: "horse", emoji: "🐴", cat: "animal" },
  { id: "bread", emoji: "🍞", cat: "food" },
  { id: "nose", emoji: "👃", cat: "body" },
  { id: "plane", emoji: "✈️", cat: "vehicle" },
  { id: "frog", emoji: "🐸", cat: "animal" },
  { id: "socks", emoji: "🧦", cat: "clothes" },
  { id: "hand", emoji: "✋", cat: "body" },
  { id: "lion", emoji: "🦁", cat: "animal" },
  { id: "grapes", emoji: "🍇", cat: "food" },
  { id: "eye", emoji: "👁️", cat: "body" },
  { id: "foot", emoji: "🦶", cat: "body" },
  { id: "ear", emoji: "👂", cat: "body" },
  { id: "giraffe", emoji: "🦒", cat: "animal" },
  { id: "mouth", emoji: "👄", cat: "body" },
  { id: "sunglasses", emoji: "🕶️", cat: "clothes" },
];

export const vword = (id: string): VWord => VWORDS.find((w) => w.id === id) ?? (VWORDS[0] as VWord);

export type Option = { id: string; emoji: string; svg?: "full" | "empty"; label?: string };

export type PickQuestion = {
  /** Mastery key. */
  key: string;
  answer: string;
  options: Option[];
  /** Spoken clips for the question. */
  ask: string[];
  /** Spoken clips for the right answer. */
  yes: string[];
  /** Headline text. */
  title: string;
  /** Optional picture shown above the choices (rhymes). */
  target?: Option;
};

function pickN<T>(items: T[], n: number, rng: Rng): T[] {
  return shuffle(items, rng).slice(0, n);
}

// ---------- Picture words ----------

export const VOCAB_TIER_NAMES = ["First words", "More words", "Tricky words", "Word whiz"] as const;

export function vocabUnlocked(m: Mastery): number {
  return Math.min(VWORDS.length, 8 + Math.floor(sumMastery(m) / 2));
}

export function makeVocab(m: Mastery, prev?: string, rng: Rng = Math.random): PickQuestion {
  const n = vocabUnlocked(m);
  const pool = VWORDS.slice(0, n);
  const target = pickWeighted(
    pool,
    (w) => m[w.id] ?? 0,
    rng,
    (w) => w.id === prev,
  );
  const choices = n < 14 ? 2 : n < 26 ? 3 : 4;
  const sameCat = VWORDS.filter(
    (w) => w.cat === target.cat && w.id !== target.id && pool.includes(w),
  );
  const others = pool.filter((w) => w.id !== target.id);
  // later on, mix in look-alike words from the same group to make it a real choice
  const hard = n >= 20 ? sameCat : [];
  const distractors = [...pickN(hard, Math.min(choices - 1, 1), rng)];
  for (const w of pickN(others, 10, rng)) {
    if (distractors.length >= choices - 1) break;
    if (!distractors.includes(w)) distractors.push(w);
  }
  const opts = shuffle([target, ...distractors], rng);
  return {
    key: target.id,
    answer: target.id,
    options: opts.map((w) => ({ id: w.id, emoji: w.emoji })),
    ask: [`vp_${target.id}`],
    yes: [`vy_${target.id}`],
    title: `Find the ${target.id}!`,
  };
}

export const vocabTier = (m: Mastery) => {
  const n = vocabUnlocked(m);
  return n < 14 ? 0 : n < 26 ? 1 : n < 36 ? 2 : 3;
};

// ---------- Sort safari ----------

export const SORT_CATS: { id: Exclude<Cat, "thing">; label: string; emoji: string }[] = [
  { id: "animal", label: "animal", emoji: "🦁" },
  { id: "food", label: "food", emoji: "🍎" },
  { id: "vehicle", label: "vehicle", emoji: "🚗" },
  { id: "clothes", label: "clothes", emoji: "👕" },
  { id: "body", label: "body part", emoji: "👂" },
  { id: "outside", label: "one you see outside", emoji: "🌳" },
];

export function sortUnlocked(m: Mastery): number {
  return Math.min(SORT_CATS.length, 2 + Math.floor(sumMastery(m) / 4));
}

export function makeSort(m: Mastery, prev?: string, rng: Rng = Math.random): PickQuestion {
  const unlocked = SORT_CATS.slice(0, sortUnlocked(m));
  const cat = pickWeighted(
    unlocked,
    (c) => m[c.id] ?? 0,
    rng,
    (c) => c.id === prev,
  );
  const inCat = VWORDS.filter((w) => w.cat === cat.id);
  const right = pickN(inCat, 1, rng)[0] as VWord;
  const others = VWORDS.filter(
    (w) => w.cat !== cat.id && w.cat !== "thing" && unlocked.some((c) => c.id === w.cat),
  );
  const wrongCount = unlocked.length <= 2 ? 2 : 3;
  const opts = shuffle([right, ...pickN(others, wrongCount, rng)], rng);
  return {
    key: cat.id,
    answer: right.id,
    options: opts.map((w) => ({ id: w.id, emoji: w.emoji })),
    ask: [`vc_${cat.id}`],
    yes: [`vy_${right.id}`],
    title: `Tap the ${cat.label}!`,
  };
}

// ---------- Opposites ----------

export type OppPair = { a: string; b: string; ea: Option; eb: Option };

export const OPP_PAIRS: OppPair[] = [
  { a: "big", b: "small", ea: { id: "big", emoji: "🐘" }, eb: { id: "small", emoji: "🐭" } },
  { a: "hot", b: "cold", ea: { id: "hot", emoji: "🔥" }, eb: { id: "cold", emoji: "🧊" } },
  { a: "happy", b: "sad", ea: { id: "happy", emoji: "😄" }, eb: { id: "sad", emoji: "😢" } },
  { a: "fast", b: "slow", ea: { id: "fast", emoji: "🐆" }, eb: { id: "slow", emoji: "🐢" } },
  { a: "day", b: "night", ea: { id: "day", emoji: "☀️" }, eb: { id: "night", emoji: "🌙" } },
  { a: "up", b: "down", ea: { id: "up", emoji: "⬆️" }, eb: { id: "down", emoji: "⬇️" } },
  { a: "wet", b: "dry", ea: { id: "wet", emoji: "💦" }, eb: { id: "dry", emoji: "🏜️" } },
  { a: "loud", b: "quiet", ea: { id: "loud", emoji: "📢" }, eb: { id: "quiet", emoji: "🤫" } },
  {
    a: "full",
    b: "empty",
    ea: { id: "full", emoji: "", svg: "full" },
    eb: { id: "empty", emoji: "", svg: "empty" },
  },
  { a: "open", b: "closed", ea: { id: "open", emoji: "📖" }, eb: { id: "closed", emoji: "📕" } },
];

export function oppUnlocked(m: Mastery): number {
  return Math.min(OPP_PAIRS.length, 3 + Math.floor(sumMastery(m) / 3));
}

export function makeOpposite(m: Mastery, prev?: string, rng: Rng = Math.random): PickQuestion {
  const pairs = OPP_PAIRS.slice(0, oppUnlocked(m));
  const pair = pickWeighted(
    pairs,
    (p) => Math.min(m[p.a] ?? 0, m[p.b] ?? 0),
    rng,
    (p) => p.a === prev,
  );
  const askA = rng() < 0.5;
  const target = askA ? pair.ea : pair.eb;
  const opts = shuffle([pair.ea, pair.eb], rng);
  return {
    key: target.id,
    answer: target.id,
    options: opts,
    ask: [`op_${target.id}`],
    yes: [`ow_${target.id}`],
    title: `Which one is ${target.id}?`,
  };
}

// ---------- Rhyme time ----------

/** `single` pairs have one recorded question (about `a`) and one recorded answer line. */
export type RhymePair = { a: string; b: string; single?: boolean };

export const RHYMES: RhymePair[] = [
  { a: "cat", b: "hat" },
  { a: "dog", b: "frog" },
  { a: "bee", b: "tree" },
  { a: "sun", b: "run" },
  { a: "star", b: "car" },
  { a: "bear", b: "chair" },
  { a: "cake", b: "snake" },
  { a: "moon", b: "spoon" },
  { a: "fox", b: "box", single: true },
  { a: "mouse", b: "house", single: true },
  { a: "bed", b: "red", single: true },
  { a: "fish", b: "dish", single: true },
  { a: "ball", b: "wall", single: true },
  { a: "bug", b: "mug", single: true },
  { a: "boat", b: "goat", single: true },
  { a: "king", b: "ring", single: true },
  { a: "pen", b: "hen", single: true },
  { a: "clock", b: "sock", single: true },
  { a: "train", b: "rain", single: true },
  { a: "nose", b: "rose", single: true },
  { a: "truck", b: "duck", single: true },
  { a: "book", b: "hook", single: true },
];

export const RHYME_EMOJI: Record<string, string> = {
  cat: "🐱",
  hat: "🎩",
  dog: "🐶",
  frog: "🐸",
  bee: "🐝",
  tree: "🌳",
  sun: "☀️",
  run: "🏃",
  star: "⭐",
  car: "🚗",
  bear: "🐻",
  chair: "🪑",
  cake: "🎂",
  snake: "🐍",
  moon: "🌙",
  spoon: "🥄",
  fox: "🦊",
  box: "📦",
  mouse: "🐭",
  house: "🏠",
  bed: "🛏️",
  red: "🔴",
  fish: "🐟",
  dish: "🍽️",
  ball: "⚽",
  wall: "🧱",
  bug: "🐛",
  mug: "☕",
  boat: "⛵",
  goat: "🐐",
  king: "🤴",
  ring: "💍",
  pen: "🖊️",
  hen: "🐔",
  clock: "⏰",
  sock: "🧦",
  train: "🚂",
  rain: "🌧️",
  nose: "👃",
  rose: "🌹",
  truck: "🚚",
  duck: "🦆",
  book: "📖",
  hook: "🪝",
};

export function rhymeUnlocked(m: Mastery): number {
  return Math.min(RHYMES.length, 3 + Math.floor(sumMastery(m) / 2));
}

/** The recorded question and answer lines for a rhyme, and which word is asked about. */
export function rhymeKeys(pair: RhymePair, word: string) {
  const w = pair.single ? pair.a : word;
  return { ask: `rh_${w}`, yes: `ry_${w}` };
}

export function makeRhyme(m: Mastery, prev?: string, rng: Rng = Math.random): PickQuestion {
  const pairs = RHYMES.slice(0, rhymeUnlocked(m));
  const pair = pickWeighted(
    pairs,
    (p) => Math.min(m[p.a] ?? 0, m[p.b] ?? 0),
    rng,
    (p) => p.a === prev || p.b === prev,
  );
  const flip = !pair.single && rng() < 0.5;
  const word = flip ? pair.b : pair.a;
  const answer = flip ? pair.a : pair.b;
  const known = pairs.flatMap((p) => [p.a, p.b]);
  const pool = (known.length >= 8 ? known : RHYMES.flatMap((p) => [p.a, p.b])).filter(
    (w) => w !== word && w !== answer && w !== pair.a && w !== pair.b,
  );
  // More choices once he is doing well: 2, then 3, then 4 pictures.
  const strong = (m[word] ?? 0) >= 2;
  const wrongN = strong ? (sumMastery(m) >= 24 ? 3 : 2) : 1;
  const opts = shuffle([answer, ...pickN(pool, wrongN, rng)], rng);
  const keys = rhymeKeys(pair, word);
  return {
    key: word,
    answer,
    options: opts.map((w) => ({ id: w, emoji: RHYME_EMOJI[w] ?? "❓" })),
    ask: [keys.ask],
    yes: [keys.yes],
    title: `Which one rhymes with ${word}?`,
    target: { id: word, emoji: RHYME_EMOJI[word] ?? "❓" },
  };
}

// ---------- Home, town and world words ----------

export type BankItem = { id: string; label: string; emoji: string; group: string; the: boolean };

const it = (id: string, label: string, emoji: string, group: string, the = true): BankItem => ({
  id,
  label,
  emoji,
  group,
  the,
});

/** Rooms and places around town, easiest first. */
export const PLACES: BankItem[] = [
  it("kitchen", "kitchen", "🍳", "home"),
  it("bedroom", "bedroom", "🛏️", "home"),
  it("store", "store", "🏪", "town"),
  it("hospital", "hospital", "🏥", "town"),
  it("living_room", "living room", "🛋️", "home"),
  it("school", "school", "🏫", "town"),
  it("police_station", "police station", "🚓", "town"),
  it("fire_station", "fire station", "🚒", "town"),
  it("bathroom", "bathroom", "🛁", "home"),
  it("park", "park", "🛝", "town"),
  it("gas_station", "gas station", "⛽", "town"),
  it("back_yard", "back yard", "🏡", "home"),
  it("restaurant", "restaurant", "🍔", "town"),
  it("laundromat", "laundromat", "🧺", "town"),
  it("dining_room", "dining room", "🍽️", "home"),
  it("library", "library", "📚", "town"),
  it("patio", "patio", "🪑", "home"),
  it("grocery_store", "grocery store", "🛒", "town"),
  it("church", "church", "⛪", "town"),
  it("garage", "garage", "🚗", "home"),
  it("post_office", "post office", "📮", "town"),
  it("bank", "bank", "🏦", "town"),
  it("airport", "airport", "✈️", "town"),
];

export const WORLD: BankItem[] = [
  it("georgia", "Georgia", "🍑", "world", false),
  it("guyana", "Guyana", "🇬🇾", "world", false),
  it("carrollton", "Carrollton", "🏙️", "world", false),
  it("usa", "USA", "🇺🇸", "world", false),
  it("america", "America", "🦅", "world", false),
  it("united_states", "United States", "🗽", "world", true),
];

export function bankUnlocked(bank: BankItem[], start: number, m: Mastery): number {
  return Math.min(bank.length, start + Math.floor(sumMastery(m) / 2));
}

export function bankTierName(bank: BankItem[], start: number, m: Mastery): string {
  return `${bankUnlocked(bank, start, m)} words`;
}

export function makeBank(
  bank: BankItem[],
  start: number,
  m: Mastery,
  prev?: string,
  rng: Rng = Math.random,
): PickQuestion {
  const n = bankUnlocked(bank, start, m);
  const pool = bank.slice(0, n);
  const target = pickWeighted(
    pool,
    (w) => m[w.id] ?? 0,
    rng,
    (w) => w.id === prev,
  );
  const choices = n < 6 ? 2 : n < 12 ? 3 : 4;
  const same = pool.filter((w) => w.group === target.group && w.id !== target.id);
  const rest = pool.filter((w) => w.id !== target.id);
  const wrong: BankItem[] = [];
  const source = n >= 10 ? [...pickN(same, 2, rng), ...pickN(rest, 12, rng)] : pickN(rest, 12, rng);
  for (const w of source) {
    if (wrong.length >= choices - 1) break;
    if (!wrong.includes(w)) wrong.push(w);
  }
  return {
    key: target.id,
    answer: target.id,
    options: shuffle([target, ...wrong], rng).map((w) => ({
      id: w.id,
      emoji: w.emoji,
      label: w.label,
    })),
    ask: [`fp_${target.id}`],
    yes: [`fy_${target.id}`],
    title: `Find ${target.the ? "the " : ""}${target.label}!`,
  };
}

export const makePlaces = (m: Mastery, prev?: string) => makeBank(PLACES, 6, m, prev);
export const makeWorld = (m: Mastery, prev?: string) => makeBank(WORLD, 3, m, prev);

/** Short cheers that say his name; one plays after every right answer. */
export const NAME_CHEER_KEYS = ["nm_0", "nm_1", "nm_3", "nm_4", "nm_5"];
let lastNameCheer = -1;
export function nameCheer(rng: Rng = Math.random): string {
  let i = Math.floor(rng() * NAME_CHEER_KEYS.length);
  if (i === lastNameCheer) i = (i + 1) % NAME_CHEER_KEYS.length;
  lastNameCheer = i;
  return NAME_CHEER_KEYS[i] as string;
}

// ---------- Memory match ----------

export type MatchLevel = { level: number; pairs: number; peekMs: number };

/**
 * The memory ladder. `at` is the recall score needed. Boards get bigger, the peek at the start
 * gets shorter, and at the top there is no peek at all: pure memory.
 */
const LADDER = [
  { at: 0, pairs: 2, peekMs: 3500 },
  { at: 2, pairs: 3, peekMs: 4000 },
  { at: 5, pairs: 4, peekMs: 4000 },
  { at: 10, pairs: 5, peekMs: 3500 },
  { at: 16, pairs: 6, peekMs: 3500 },
  { at: 24, pairs: 8, peekMs: 3500 },
  { at: 34, pairs: 10, peekMs: 3000 },
  { at: 46, pairs: 12, peekMs: 2500 },
  { at: 62, pairs: 12, peekMs: 0 },
] as const;

export function matchLevel(m: Mastery, maxPairs = 12): MatchLevel {
  const s = sumMastery(m);
  let i = 0;
  for (const [k, step] of LADDER.entries()) if (s >= step.at) i = k;
  const step = LADDER[i] as (typeof LADDER)[number];
  return { level: i + 1, pairs: Math.min(step.pairs, maxPairs), peekMs: step.peekMs };
}
export const MATCH_LEVELS = LADDER.length;

export const memoryPairs = (m: Mastery): number => matchLevel(m).pairs;

export function makeMemory(m: Mastery, rng: Rng = Math.random): VWord[] {
  const n = memoryPairs(m);
  const pool = VWORDS.slice(0, Math.max(12, vocabUnlocked(m)));
  if (n < 6) return pickN(pool, n, rng);
  // Harder boards: half the cards look alike (same kind of thing), so he has to look closely.
  const cats = shuffle([...new Set(pool.map((w) => w.cat))], rng);
  const same = pool.filter((w) => w.cat === cats[0]);
  const first = pickN(same, Math.min(same.length, Math.floor(n / 2)), rng);
  const rest = pickN(
    pool.filter((w) => !first.includes(w)),
    n - first.length,
    rng,
  );
  return [...first, ...rest];
}

export const photoPairs = (m: Mastery): number => matchLevel(m, 10).pairs;
export const ALBUM_COUNT = 21;
export const albumSrc = (i: number) => `/photos/album/a${String(i + 1).padStart(2, "0")}.webp`;

export const rhymeMatchPairs = (m: Mastery): number => matchLevel(m, 8).pairs;
export function makeRhymeMatch(m: Mastery, rng: Rng = Math.random): RhymePair[] {
  const pool = RHYMES.slice(0, Math.max(rhymeUnlocked(m), 6));
  return pickN(pool, rhymeMatchPairs(m), rng);
}

// ---------- Find it on Sonny ----------

export type Box = [number, number, number, number]; // x1 y1 x2 y2 in the scene's base size

export type Scene = {
  id: string;
  src: string;
  w: number;
  h: number;
  /** word -> where it is in the picture (one or more boxes). */
  targets: Record<string, Box[]>;
};

/** Tap targets are never tiny: grow each box to at least 22% of the width and 13% of the height. */
export function fatBox(scene: Scene, [x1, y1, x2, y2]: Box): Box {
  const w = Math.max(x2 - x1, scene.w * 0.22);
  const h = Math.max(y2 - y1, scene.h * 0.13);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const nx1 = Math.min(Math.max(cx - w / 2, 0), scene.w - w);
  const ny1 = Math.min(Math.max(cy - h / 2, 0), scene.h - h);
  return [nx1, ny1, nx1 + w, ny1 + h];
}

const boxArea = ([x1, y1, x2, y2]: Box) => (x2 - x1) * (y2 - y1);

/** Big things first; smaller things only once he is finding the big ones. */
export function findWords(scene: Scene, tier: 0 | 1 | 2): string[] {
  const all = Object.keys(scene.targets);
  const share = (w: string) =>
    Math.max(...(scene.targets[w] ?? []).map((b) => boxArea(b))) / (scene.w * scene.h);
  const min = tier === 0 ? 0.04 : tier === 1 ? 0.012 : 0;
  const ok = all.filter((w) => share(w) >= min);
  return ok;
}

export const SCENES: Scene[] = [
  {
    id: "police",
    src: "/photos/scenes/police.webp",
    w: 1500,
    h: 2000,
    targets: {
      hat: [[260, 190, 990, 800]],
      sunglasses: [[400, 680, 930, 920]],
      mouth: [[590, 930, 770, 1010]],
      car: [[370, 1500, 960, 1900]],
      shirt: [[140, 1090, 1090, 2000]],
    },
  },
  {
    id: "giraffe",
    src: "/photos/scenes/giraffe.webp",
    w: 1500,
    h: 2000,
    targets: {
      giraffe: [[0, 460, 720, 2000]],
      sunglasses: [
        [665, 700, 990, 870],
        [160, 570, 560, 700],
      ],
      hair: [[620, 470, 960, 720]],
      mouth: [[750, 880, 890, 930]],
      nose: [[770, 790, 850, 850]],
      shirt: [[410, 960, 1100, 1500]],
      hand: [[725, 1660, 870, 1870]],
    },
  },
  {
    id: "racing",
    src: "/photos/scenes/racing.webp",
    w: 1074,
    h: 1905,
    targets: {
      sunglasses: [[365, 570, 775, 740]],
      hair: [[310, 180, 840, 480]],
      nose: [[510, 720, 600, 790]],
      mouth: [[515, 790, 615, 850]],
      car: [[195, 1275, 585, 1415]],
      hand: [
        [150, 1250, 340, 1500],
        [440, 1300, 650, 1530],
      ],
    },
  },
  {
    id: "shades",
    src: "/photos/scenes/shades.webp",
    w: 1500,
    h: 2000,
    targets: {
      hair: [[520, 230, 1150, 640]],
      sunglasses: [[620, 480, 1055, 720]],
      shirt: [[590, 820, 1410, 1480]],
      hand: [[250, 940, 540, 1210]],
      mouth: [[790, 740, 1010, 810]],
    },
  },
  {
    id: "pajamas",
    src: "/photos/scenes/pajamas.webp",
    w: 1500,
    h: 2000,
    targets: {
      shirt: [[440, 550, 1010, 1280]],
      hair: [[780, 60, 1290, 420]],
      socks: [[410, 1420, 700, 1560]],
      mouth: [[790, 590, 930, 680]],
    },
  },
  {
    id: "bucket",
    src: "/photos/scenes/bucket.webp",
    w: 1500,
    h: 2000,
    targets: {
      hat: [[530, 160, 1090, 640]],
      shirt: [[250, 700, 1050, 1550]],
      shoe: [[600, 1720, 770, 2000]],
      mouth: [[740, 670, 900, 730]],
    },
  },
  {
    id: "wolf",
    src: "/photos/scenes/wolf.webp",
    w: 1500,
    h: 2000,
    targets: {
      hat: [[640, 180, 1000, 520]],
      shoe: [
        [330, 1360, 530, 1580],
        [840, 1510, 1000, 1810],
      ],
      car: [[690, 920, 800, 1030]],
      cookie: [[965, 985, 1065, 1050]],
    },
  },
  {
    id: "parade",
    src: "/photos/scenes/parade.webp",
    w: 1170,
    h: 1614,
    targets: {
      sirius: [[520, 470, 700, 870]],
      tree: [[820, 90, 1170, 520]],
      house: [[370, 90, 740, 620]],
    },
  },
  {
    id: "purple",
    src: "/photos/scenes/purple.webp",
    w: 1500,
    h: 2000,
    targets: {
      hat: [[350, 330, 820, 770]],
      shirt: [[340, 830, 1000, 1480]],
      shoe: [[600, 1690, 890, 1830]],
    },
  },
  {
    id: "publix",
    src: "/photos/scenes/publix.webp",
    w: 1200,
    h: 1600,
    targets: {
      sunglasses: [[270, 255, 660, 390]],
      hat: [[230, 40, 640, 290]],
      shoe: [
        [420, 1290, 560, 1510],
        [620, 1120, 800, 1380],
      ],
    },
  },
  {
    id: "kroger",
    src: "/photos/scenes/kroger.webp",
    w: 1500,
    h: 2000,
    targets: {
      hat: [[610, 30, 1000, 440]],
      shirt: [[520, 420, 1180, 1000]],
      pizza: [[330, 1380, 980, 1800]],
      shoe: [
        [720, 1650, 930, 1860],
        [1170, 1660, 1390, 1870],
      ],
    },
  },
];

export type FindQuestion = { scene: Scene; word: string };

/** Names that are read out with a capital letter. */
export const FIND_NAMES: Record<string, string> = { sirius: "Sirius" };

export function findTier(m: Mastery): 0 | 1 | 2 {
  const s = sumMastery(m);
  return s >= 14 ? 2 : s >= 6 ? 1 : 0;
}

export function makeFind(m: Mastery, prev?: string, rng: Rng = Math.random): FindQuestion {
  const tier = findTier(m);
  const scenes = SCENES.filter((sc) => findWords(sc, tier).length > 0);
  const scene = (scenes[Math.floor(rng() * scenes.length)] ?? SCENES[0]) as Scene;
  const words = findWords(scene, tier);
  const word = pickWeighted(
    words,
    (w) => m[`${scene.id}_${w}`] ?? 0,
    rng,
    (w) => `${scene.id}_${w}` === prev,
  );
  return { scene, word };
}

export const hitBox = (scene: Scene, word: string, fx: number, fy: number): boolean =>
  (scene.targets[word] ?? []).some((box) => {
    const [x1, y1, x2, y2] = fatBox(scene, box);
    const x = fx * scene.w;
    const y = fy * scene.h;
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  });
