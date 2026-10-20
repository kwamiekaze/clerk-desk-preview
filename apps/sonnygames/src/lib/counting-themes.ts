import type { CountingTheme } from "@/components/game/ThemeCounting";

export const COUNTING_THEMES = {
  police: {
    title: "Police Patrol",
    emoji: "👮🏾",
    sonny: "/sonny/police.webp",
    background: "bg-gradient-to-b from-sky-200/50 to-blue-300/60",
    panel: "bg-gradient-to-br from-blue-700 via-blue-600 to-red-500",
    itemSets: [
      { name: "badges", singular: "badge", emoji: "🛡️" },
      { name: "police cars", singular: "police car", emoji: "🚓" },
      { name: "sirens", singular: "siren", emoji: "🚨" },
      { name: "radios", singular: "radio", emoji: "📻" },
      { name: "traffic cones", singular: "traffic cone", emoji: "🚧" },
    ],
  },
  sailor: {
    title: "Sailor Adventure",
    emoji: "⚓",
    sonny: "/sonny/sailor.webp",
    background: "bg-gradient-to-b from-cyan-100/60 to-blue-300/70",
    panel: "bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-800",
    itemSets: [
      { name: "boats", singular: "boat", emoji: "⛵" },
      { name: "anchors", singular: "anchor", emoji: "⚓" },
      { name: "fish", singular: "fish", emoji: "🐠" },
      { name: "shells", singular: "shell", emoji: "🐚" },
      { name: "life rings", singular: "life ring", emoji: "🛟" },
    ],
  },
  musician: {
    title: "Music Maker",
    emoji: "🎸",
    sonny: "/sonny/musician.webp",
    background: "bg-gradient-to-b from-fuchsia-100/60 to-violet-300/70",
    panel: "bg-gradient-to-br from-violet-700 via-fuchsia-600 to-rose-500",
    itemSets: [
      { name: "guitars", singular: "guitar", emoji: "🎸" },
      { name: "music notes", singular: "music note", emoji: "🎵" },
      { name: "drums", singular: "drum", emoji: "🥁" },
      { name: "microphones", singular: "microphone", emoji: "🎤" },
      { name: "pianos", singular: "piano", emoji: "🎹" },
    ],
  },
  foodie: {
    title: "Foodie Fun",
    emoji: "🍔",
    sonny: "/sonny/foodie.webp",
    background: "bg-gradient-to-b from-amber-100/60 to-orange-300/70",
    panel: "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500",
    itemSets: [
      { name: "burgers", singular: "burger", emoji: "🍔" },
      { name: "fries", singular: "fries", emoji: "🍟" },
      { name: "apples", singular: "apple", emoji: "🍎" },
      { name: "pizza slices", singular: "pizza slice", emoji: "🍕" },
      { name: "cupcakes", singular: "cupcake", emoji: "🧁" },
    ],
  },
  sleeping: {
    title: "Sleepy Time",
    emoji: "🌙",
    sonny: "/sonny/sleeping.webp",
    background: "bg-gradient-to-b from-indigo-200/60 to-violet-300/70",
    panel: "bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700",
    itemSets: [
      { name: "moons", singular: "moon", emoji: "🌙" },
      { name: "stars", singular: "star", emoji: "⭐" },
      { name: "pillows", singular: "pillow", emoji: "🛏️" },
      { name: "teddy bears", singular: "teddy bear", emoji: "🧸" },
      { name: "clouds", singular: "cloud", emoji: "☁️" },
    ],
  },
  dinosaur: {
    title: "Dinosaur Dig",
    emoji: "🦖",
    sonny: "/sonny/dinosaur.webp",
    background: "bg-gradient-to-b from-lime-100/70 to-emerald-300/70",
    panel: "bg-gradient-to-br from-emerald-900 via-green-700 to-lime-500",
    itemSets: [
      { name: "dinosaurs", singular: "dinosaur", emoji: "🦖" },
      { name: "dinosaur eggs", singular: "dinosaur egg", emoji: "🥚" },
      { name: "fossils", singular: "fossil", emoji: "🦴" },
      { name: "footprints", singular: "footprint", emoji: "🐾" },
      { name: "jungle leaves", singular: "jungle leaf", emoji: "🌿" },
    ],
  },
} as const satisfies Record<string, CountingTheme>;

export type CountingThemeId = keyof typeof COUNTING_THEMES;
