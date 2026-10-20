// Word Train: pick up letter crates to build a word, ride to Word Town, drop the letters off to spell it.
import { WORDS } from "./content";
import { pickWeighted, shuffle, sumMastery, type Mastery } from "./adaptive";
import { VWORDS } from "./vocab";

type Rng = () => number;

export type TrainWord = {
  id: string;
  word: string; // uppercase
  emoji: string;
  /** Show Sonny John's train photo instead of an emoji. */
  photo?: boolean;
  /** Recorded line that says the word is about to be spelled. */
  intro: string;
  /** Recorded line that spells the word back and says it. */
  done: string;
};

const fromWords = (w: string): TrainWord => {
  const info = WORDS.find((x) => x.word === w);
  if (!info) throw new Error(`no word ${w}`);
  return {
    id: w.toLowerCase(),
    word: w,
    emoji: info.emoji,
    photo: w === "SONNY" || w === "JOHN",
    intro: `spell_${w}`,
    done: `word_${w}`,
  };
};

/** Picture words that have no spelling line yet: we recorded "Let's spell ..." for each. */
export const NEW_TRAIN_WORDS = [
  "cow",
  "pig",
  "star",
  "tree",
  "duck",
  "boat",
  "shoe",
  "bird",
  "book",
  "milk",
  "frog",
  "lion",
  "nose",
  "hand",
  "foot",
  "apple",
  "pizza",
  "train",
  "house",
  "horse",
  "bread",
  "plane",
  "socks",
  "shirt",
  "mouth",
] as const;

const fromVocab = (id: string): TrainWord => {
  const v = VWORDS.find((x) => x.id === id);
  if (!v) throw new Error(`no vocab word ${id}`);
  return { id, word: id.toUpperCase(), emoji: v.emoji, intro: `tw_${id}`, done: `vy_${id}` };
};

export const TRAIN_WORDS: TrainWord[] = [
  ...["CAR", "BUS", "SUN", "DOG", "CAT", "HAT", "BED", "VAN", "JET"].map(fromWords),
  ...["FISH", "BALL", "MOON", "STOP", "ROAD", "RACE", "JOHN"].map(fromWords),
  ...["TRUCK", "SONNY"].map(fromWords),
  ...NEW_TRAIN_WORDS.map(fromVocab),
];

export type TrainLevel = {
  level: number;
  /** Longest word he gets. */
  len: number;
  /** Crates on the platform at each pick-up. */
  crates: number;
  /** Cars are mixed up (not in spelling order) at the drop-off. */
  mixed: boolean;
  /** The voice names each letter at the drop-off (otherwise he has to know what comes next). */
  say: boolean;
};

const LEVELS: (TrainLevel & { at: number })[] = [
  { at: 0, level: 1, len: 3, crates: 2, mixed: false, say: true },
  { at: 4, level: 2, len: 3, crates: 3, mixed: true, say: true },
  { at: 10, level: 3, len: 4, crates: 3, mixed: true, say: true },
  { at: 18, level: 4, len: 4, crates: 4, mixed: true, say: false },
  { at: 28, level: 5, len: 5, crates: 4, mixed: true, say: false },
  { at: 40, level: 6, len: 5, crates: 5, mixed: true, say: false },
];
export const TRAIN_LEVELS = LEVELS.length;

export function trainLevel(m: Mastery): TrainLevel {
  const s = sumMastery(m);
  let cur = LEVELS[0] as TrainLevel & { at: number };
  for (const l of LEVELS) if (s >= l.at) cur = l;
  return cur;
}

/** Three words for one trip: mostly the longest he is ready for, favouring the ones he knows least. */
export function makeTrainWords(m: Mastery, n = 3, rng: Rng = Math.random): TrainWord[] {
  const lvl = trainLevel(m);
  const pool = TRAIN_WORDS.filter((w) => w.word.length <= lvl.len);
  const chosen: TrainWord[] = [];
  for (let i = 0; i < n; i++) {
    const left = pool.filter((w) => !chosen.includes(w));
    const hard = left.filter((w) => w.word.length === lvl.len);
    const from = hard.length > 0 && rng() < 0.7 ? hard : left;
    chosen.push(pickWeighted(from, (w) => m[w.id] ?? 0, rng));
  }
  return chosen;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** The letter he needs plus letters that are not in the word, shuffled. */
export function crateLetters(
  word: string,
  index: number,
  count: number,
  rng: Rng = Math.random,
): string[] {
  const need = word.charAt(index);
  const others = shuffle(
    ALPHABET.filter((l) => !word.includes(l)),
    rng,
  ).slice(0, count - 1);
  return shuffle([need, ...others], rng);
}

/** Letters riding the train to Word Town. Each car is its own item so that repeated letters work. */
export function dropCars(word: string, mixed: boolean, rng: Rng = Math.random) {
  const cars = word.split("").map((letter, i) => ({ id: i, letter }));
  return mixed ? shuffle(cars, rng) : cars;
}

/** Every letter any train word uses (so every letter has its recorded lines). */
export const TRAIN_LETTERS = [...new Set(TRAIN_WORDS.flatMap((w) => w.word.split("")))].sort();
