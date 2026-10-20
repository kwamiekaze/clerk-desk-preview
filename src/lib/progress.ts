import { useSyncExternalStore } from "react";
import { MAX_MASTERY, type Mastery } from "./adaptive";

export type Progress = {
  stars: number;
  rounds: number;
  letters: Mastery;
  words: Mastery;
  counting: Mastery;
  parking: Mastery;
  compare: Mastery;
  traffic: Mastery;
  people: Mastery;
  ghosts: Mastery;
  soccer: Mastery;
  carshow: Mastery;
  numbers: Mastery;
  patterns: Mastery;
  vocab: Mastery;
  sorts: Mastery;
  opposites: Mastery;
  rhymes: Mastery;
  memory: Mastery;
  findit: Mastery;
  photomatch: Mastery;
  rhymematch: Mastery;
  balloons: Mastery;
  wordtrain: Mastery;
  boat: Mastery;
  plane: Mastery;
  sequence: Mastery;
  missing: Mastery;
  places: Mastery;
  world: Mastery;
  selectedCar: string;
  muted: boolean;
};

const KEY = "sonny-progress-v1";

const DEFAULTS: Progress = {
  stars: 0,
  rounds: 0,
  letters: {},
  words: {},
  counting: {},
  parking: {},
  compare: {},
  traffic: {},
  people: {},
  ghosts: {},
  soccer: {},
  carshow: {},
  numbers: {},
  patterns: {},
  vocab: {},
  sorts: {},
  opposites: {},
  rhymes: {},
  memory: {},
  findit: {},
  photomatch: {},
  rhymematch: {},
  balloons: {},
  wordtrain: {},
  boat: {},
  plane: {},
  sequence: {},
  missing: {},
  places: {},
  world: {},
  selectedCar: "red-rocket",
  muted: false,
};

let state: Progress = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // storage blocked or corrupt - just use defaults
  }
}

function commit(next: Progress) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
  commitHooks.forEach((h) => h(state));
}

const commitHooks = new Set<(p: Progress) => void>();

/** Lets the sync layer hear about every change (to save it to the cloud). */
export function onProgressCommit(cb: (p: Progress) => void) {
  commitHooks.add(cb);
  return () => commitHooks.delete(cb);
}

/** Replace everything (used when continuing from a saved code). */
export function replaceProgress(next: Progress) {
  commit({ ...DEFAULTS, ...next });
}

export function getProgress(): Progress {
  load();
  return state;
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, () => DEFAULTS);
}

export type Bucket =
  | "letters"
  | "words"
  | "counting"
  | "parking"
  | "compare"
  | "traffic"
  | "people"
  | "ghosts"
  | "soccer"
  | "carshow"
  | "numbers"
  | "patterns"
  | "vocab"
  | "sorts"
  | "opposites"
  | "rhymes"
  | "memory"
  | "findit"
  | "photomatch"
  | "rhymematch"
  | "balloons"
  | "wordtrain"
  | "boat"
  | "plane"
  | "sequence"
  | "missing"
  | "places"
  | "world";

/** Record an answer: first-try correct raises mastery, a miss lowers it. */
export function recordAnswer(bucket: Bucket, key: string, firstTryCorrect: boolean) {
  const s = getProgress();
  const cur = s[bucket][key] ?? 0;
  const next = firstTryCorrect ? Math.min(MAX_MASTERY, cur + 1) : Math.max(0, cur - 1);
  commit({ ...s, [bucket]: { ...s[bucket], [key]: next } });
}

export function addStars(n: number) {
  const s = getProgress();
  commit({ ...s, stars: s.stars + n, rounds: s.rounds + 1 });
}

export function selectCar(id: string) {
  commit({ ...getProgress(), selectedCar: id });
}

export function setMuted(muted: boolean) {
  commit({ ...getProgress(), muted });
}

export function resetProgress() {
  const { muted } = getProgress();
  commit({ ...DEFAULTS, muted });
}

/** Grown-up fix-up: set the star total directly (cars unlock from stars). */
export function setStars(n: number) {
  commit({ ...getProgress(), stars: Math.max(0, Math.min(999, Math.round(n))) });
}
