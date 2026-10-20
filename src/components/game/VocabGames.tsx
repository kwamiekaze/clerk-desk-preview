import { voiceGroup } from "@/lib/voice-groups";
import {
  bankTierName,
  makeOpposite,
  makePlaces,
  makeWorld,
  PLACES,
  WORLD,
  makeRhyme,
  makeSort,
  makeVocab,
  oppUnlocked,
  rhymeUnlocked,
  sortUnlocked,
  VOCAB_TIER_NAMES,
  vocabTier,
} from "@/lib/vocab";
import type { Mastery } from "@/lib/adaptive";
import { PickGame, type PickConfig } from "./PickGame";

const VOCAB: PickConfig = {
  title: "Picture Words",
  emoji: "🖼️",
  bg: "meadow",
  ring: "ring-emerald-300",
  text: "text-emerald-950",
  bucket: "vocab",
  make: makeVocab,
  tierName: (m: Mastery) => VOCAB_TIER_NAMES[vocabTier(m)],
  clips: () => voiceGroup("vocab"),
  hello: ["v_hello"],
  mascot: { idle: "/sonny/sonny-green.webp", cheer: "/sonny/dinosaur.webp" },
  hero: "/sonny/friends.webp",
  heroAlt: "Sonny John and his friend",
};

const SORT: PickConfig = {
  title: "Sort Safari",
  emoji: "🦁",
  bg: "dusk",
  ring: "ring-amber-300",
  text: "text-amber-950",
  bucket: "sorts",
  make: makeSort,
  tierName: (m: Mastery) => `${sortUnlocked(m)} groups`,
  clips: () => voiceGroup("sorts"),
  hello: ["s_hello"],
  mascot: { idle: "/sonny/dinosaur.webp", cheer: "/sonny/dinosaur.webp" },
  hero: "/sonny/dinosaur.webp",
  heroAlt: "Sonny John in his dinosaur costume",
};

const OPP: PickConfig = {
  title: "Opposites",
  emoji: "↔️",
  bg: "candy",
  ring: "ring-fuchsia-300",
  text: "text-fuchsia-950",
  bucket: "opposites",
  make: makeOpposite,
  tierName: (m: Mastery) => `${oppUnlocked(m)} pairs`,
  clips: () => voiceGroup("opposites"),
  hello: ["o_hello"],
  mascot: { idle: "/sonny/musician.webp", cheer: "/sonny/musician.webp" },
  hero: "/sonny/musician.webp",
  heroAlt: "Sonny John the musician",
};

const RHYME: PickConfig = {
  title: "Rhyme Time",
  emoji: "🎤",
  bg: "train",
  ring: "ring-violet-300",
  text: "text-violet-950",
  bucket: "rhymes",
  make: makeRhyme,
  tierName: (m: Mastery) => `${rhymeUnlocked(m)} rhymes`,
  clips: () => voiceGroup("rhymes"),
  hello: ["r_hello"],
  mascot: { idle: "/sonny/foodie.webp", cheer: "/sonny/foodie.webp" },
  hero: "/sonny/foodie.webp",
  heroAlt: "Sonny John the chef",
};

export const PictureWords = () => <PickGame cfg={VOCAB} />;
export const SortSafari = () => <PickGame cfg={SORT} />;
export const Opposites = () => <PickGame cfg={OPP} />;
export const RhymeTime = () => <PickGame cfg={RHYME} />;

const PLACES_CFG: PickConfig = {
  title: "Home & Town",
  emoji: "🏘️",
  bg: "dusk",
  ring: "ring-orange-300",
  text: "text-orange-950",
  bucket: "places",
  make: makePlaces,
  tierName: (m: Mastery) => bankTierName(PLACES, 6, m),
  clips: () => voiceGroup("places"),
  hello: ["p_hello"],
  mascot: { idle: "/sonny/police.webp", cheer: "/sonny/police.webp" },
  hero: "/sonny/police.webp",
  heroAlt: "Sonny John the police officer",
};

const WORLD_CFG: PickConfig = {
  title: "My World",
  emoji: "🌎",
  bg: "meadow",
  ring: "ring-sky-300",
  text: "text-sky-950",
  bucket: "world",
  make: makeWorld,
  tierName: (m: Mastery) => bankTierName(WORLD, 3, m),
  clips: () => voiceGroup("world"),
  hello: ["w_hello"],
  mascot: { idle: "/sonny/sailor.webp", cheer: "/sonny/sailor.webp" },
  hero: "/sonny/sailor.webp",
  heroAlt: "Sonny John the sailor",
};

export const HomeTown = () => <PickGame cfg={PLACES_CFG} />;
export const MyWorld = () => <PickGame cfg={WORLD_CFG} />;
