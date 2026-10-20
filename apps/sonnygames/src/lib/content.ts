// All learning content for Sonny's games lives here so it is easy to tweak.

export type LetterInfo = {
  letter: string; // uppercase
  word: string; // example word
  emoji: string;
  sound: string; // how to say the sound out loud (for text-to-speech)
};

// Learning order: Sonny John's name first (S-O-N-Y-J), then family initials, then the rest.
export const LETTER_ORDER = "SONYJRMCABDEFGHIKLPQTUVWXZ".split("");

const LETTER_DATA: Record<string, Omit<LetterInfo, "letter">> = {
  A: { word: "apple", emoji: "🍎", sound: "ah" },
  B: { word: "bus", emoji: "🚌", sound: "buh" },
  C: { word: "car", emoji: "🚗", sound: "kuh kuh" },
  D: { word: "dog", emoji: "🐶", sound: "duh" },
  E: { word: "elephant", emoji: "🐘", sound: "eh eh" },
  F: { word: "fire truck", emoji: "🚒", sound: "fff" },
  G: { word: "grapes", emoji: "🍇", sound: "guh" },
  H: { word: "hat", emoji: "🎩", sound: "huh" },
  I: { word: "ice cream", emoji: "🍦", sound: "ih" },
  J: { word: "jet", emoji: "✈️", sound: "juh juh" },
  K: { word: "kite", emoji: "🪁", sound: "kuh" },
  L: { word: "lion", emoji: "🦁", sound: "lll" },
  M: { word: "moon", emoji: "🌙", sound: "mmm" },
  N: { word: "nose", emoji: "👃", sound: "nnn" },
  O: { word: "orange", emoji: "🍊", sound: "ah" },
  P: { word: "pizza", emoji: "🍕", sound: "puh" },
  Q: { word: "queen", emoji: "👑", sound: "kwuh kwuh" },
  R: { word: "race car", emoji: "🏎️", sound: "ruh" },
  S: { word: "sun", emoji: "☀️", sound: "sss" },
  T: { word: "truck", emoji: "🚚", sound: "tuh tuh" },
  U: { word: "umbrella", emoji: "☂️", sound: "uh" },
  V: { word: "van", emoji: "🚐", sound: "vvv" },
  W: { word: "whale", emoji: "🐳", sound: "wuh" },
  X: { word: "x marks the spot", emoji: "❌", sound: "ks" },
  Y: { word: "yarn", emoji: "🧶", sound: "yuh" },
  Z: { word: "zebra", emoji: "🦓", sound: "zzz" },
};

export const LETTERS: LetterInfo[] = LETTER_ORDER.map((letter) => ({
  letter,
  word: LETTER_DATA[letter]?.word ?? "",
  emoji: LETTER_DATA[letter]?.emoji ?? "",
  sound: LETTER_DATA[letter]?.sound ?? "",
}));

export const LETTER_BY_CHAR: Record<string, LetterInfo> = Object.fromEntries(
  LETTERS.map((l) => [l.letter, l]),
);

// How to say each letter's NAME out loud (single capitals are read badly by some voices).
export const LETTER_NAMES: Record<string, string> = {
  A: "ay",
  B: "bee",
  C: "see",
  D: "dee",
  E: "ee",
  F: "eff",
  G: "gee",
  H: "aitch",
  I: "eye",
  J: "jay",
  K: "kay",
  L: "ell",
  M: "em",
  N: "en",
  O: "oh",
  P: "pee",
  Q: "cue",
  R: "are",
  S: "ess",
  T: "tee",
  U: "you",
  V: "vee",
  W: "double you",
  X: "ex",
  Y: "why",
  Z: "zee",
};

export const letterName = (l: string) => LETTER_NAMES[l.toUpperCase()] ?? l;

export type WordInfo = {
  word: string; // uppercase
  emoji: string;
  special?: string; // extra line to say after spelling it
};

// Ordered from easiest to hardest.
export const WORDS: WordInfo[] = [
  { word: "CAR", emoji: "🚗" },
  { word: "BUS", emoji: "🚌" },
  { word: "SUN", emoji: "☀️" },
  { word: "GO", emoji: "🟢" },
  { word: "DOG", emoji: "🐶" },
  { word: "CAT", emoji: "🐱" },
  { word: "VAN", emoji: "🚐" },
  { word: "SONNY", emoji: "👦", special: "That's your name!" },
  { word: "JOHN", emoji: "🧒", special: "That's part of your name!" },
  { word: "HAT", emoji: "🎩" },
  { word: "JET", emoji: "✈️" },
  { word: "RED", emoji: "🔴" },
  { word: "BED", emoji: "🛏️" },
  { word: "STOP", emoji: "🛑" },
  { word: "FAST", emoji: "⚡" },
  { word: "ROAD", emoji: "🛣️" },
  { word: "FISH", emoji: "🐟" },
  { word: "BALL", emoji: "⚽" },
  { word: "MOON", emoji: "🌙" },
  { word: "TRUCK", emoji: "🚚" },
  { word: "RACE", emoji: "🏁" },
];

export type CarColor = { name: string; hex: string };

export const COLORS: CarColor[] = [
  { name: "red", hex: "#ef4444" },
  { name: "blue", hex: "#3b82f6" },
  { name: "yellow", hex: "#facc15" },
  { name: "green", hex: "#22c55e" },
  { name: "orange", hex: "#fb923c" },
  { name: "purple", hex: "#a855f7" },
  { name: "pink", hex: "#f472b6" },
];

export type CarStyle = "coupe" | "wedge" | "roadster" | "hyper";

export type GarageCar = {
  id: string;
  name: string;
  color: string; // hex or "rainbow"
  style: CarStyle;
  stripe?: string; // stripe colour
  cost: number; // stars needed
};

export const GARAGE: GarageCar[] = [
  { id: "red-rocket", name: "Red Rocket", color: "#ef4444", style: "coupe", cost: 0 },
  { id: "blue-bolt", name: "Blue Bolt", color: "#3b82f6", style: "wedge", cost: 0 },
  { id: "sunny-speedster", name: "Sunny Speedster", color: "#facc15", style: "roadster", cost: 2 },
  { id: "green-machine", name: "Green Machine", color: "#22c55e", style: "hyper", cost: 4 },
  {
    id: "orange-flash",
    name: "Orange Flash",
    color: "#fb923c",
    style: "coupe",
    stripe: "#ffffff",
    cost: 6,
  },
  { id: "purple-storm", name: "Purple Storm", color: "#a855f7", style: "wedge", cost: 9 },
  { id: "pink-cruiser", name: "Pink Cruiser", color: "#f472b6", style: "roadster", cost: 12 },
  {
    id: "turbo-teal",
    name: "Turbo Teal",
    color: "#14b8a6",
    style: "hyper",
    stripe: "#ffffff",
    cost: 16,
  },
  {
    id: "silver-streak",
    name: "Silver Streak",
    color: "#cbd5e1",
    style: "coupe",
    stripe: "#3b82f6",
    cost: 20,
  },
  {
    id: "midnight-racer",
    name: "Midnight Racer",
    color: "#2d2d3a",
    style: "hyper",
    stripe: "#facc15",
    cost: 25,
  },
  {
    id: "golden-champ",
    name: "Golden Champ",
    color: "#f59e0b",
    style: "roadster",
    stripe: "#ffffff",
    cost: 30,
  },
  { id: "rainbow-rocket", name: "Rainbow Rocket", color: "rainbow", style: "wedge", cost: 40 },
];

export const DEFAULT_CAR = GARAGE[0] as GarageCar;

export const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

// The people in Sonny John's life. `say` is how the voice should pronounce the name.
export type PersonGroup = "family" | "cousin" | "school";
export type Person = {
  id: string;
  name: string; // shown on screen
  say: string; // spoken spelling
  role: string; // e.g. "mom"
  group: PersonGroup;
  emoji: string;
  color: string;
};

export const PEOPLE: Person[] = [
  {
    id: "ryanne",
    name: "Ryanne",
    say: "Ryanne",
    role: "mom",
    group: "family",
    emoji: "👩🏾",
    color: "#f472b6",
  },
  {
    id: "quamie",
    name: "Quamie",
    say: "Kwah-mee",
    role: "dad",
    group: "family",
    emoji: "👨🏾",
    color: "#3b82f6",
  },
  {
    id: "sirius",
    name: "Sirius",
    say: "Seer-ee-us",
    role: "sister",
    group: "family",
    emoji: "👧🏾",
    color: "#a855f7",
  },
  {
    id: "mimi",
    name: "Mimi",
    say: "Mimi",
    role: "grandma",
    group: "family",
    emoji: "👵🏾",
    color: "#fb923c",
  },
  {
    id: "bigpapa",
    name: "Big Papa",
    say: "Big Papa",
    role: "grandpa",
    group: "family",
    emoji: "👴🏾",
    color: "#22c55e",
  },
  {
    id: "grandma",
    name: "Grandma Debie",
    say: "Grandma Debbie",
    role: "grandma",
    group: "family",
    emoji: "👵🏽",
    color: "#ef4444",
  },
  {
    id: "grandpa",
    name: "Grandpa Peter",
    say: "Grandpa Peter",
    role: "grandpa",
    group: "family",
    emoji: "👴🏽",
    color: "#14b8a6",
  },
  {
    id: "honey",
    name: "Honey",
    say: "Honey",
    role: "cousin",
    group: "cousin",
    emoji: "🧒🏾",
    color: "#facc15",
  },
  {
    id: "rhyus",
    name: "Rhyus",
    say: "Ry-Us",
    role: "cousin",
    group: "cousin",
    emoji: "🧒🏾",
    color: "#3b82f6",
  },
  {
    id: "annie",
    name: "Annie",
    say: "Annie",
    role: "cousin",
    group: "cousin",
    emoji: "🧒🏾",
    color: "#f472b6",
  },
  {
    id: "ethan",
    name: "Ethan",
    say: "Ethan",
    role: "cousin",
    group: "cousin",
    emoji: "🧒🏾",
    color: "#22c55e",
  },
  {
    id: "hayden",
    name: "Hayden",
    say: "Hayden",
    role: "cousin",
    group: "cousin",
    emoji: "🧒🏾",
    color: "#a855f7",
  },
  {
    id: "cici",
    name: "Cici",
    say: "Cici",
    role: "teacher",
    group: "school",
    emoji: "🧑🏾‍🏫",
    color: "#fb923c",
  },
  {
    id: "joanne",
    name: "Joanne",
    say: "Joanne",
    role: "teacher",
    group: "school",
    emoji: "🧑🏾‍🏫",
    color: "#ef4444",
  },
  {
    id: "cynthia",
    name: "Cynthia",
    say: "Cynthia",
    role: "teacher",
    group: "school",
    emoji: "🧑🏾‍🏫",
    color: "#14b8a6",
  },
  {
    id: "rome",
    name: "Rome",
    say: "Rome",
    role: "best friend",
    group: "school",
    emoji: "🧒🏾",
    color: "#facc15",
  },
];

export const PEOPLE_BY_ID: Record<string, Person> = Object.fromEntries(
  PEOPLE.map((p) => [p.id, p]),
);
