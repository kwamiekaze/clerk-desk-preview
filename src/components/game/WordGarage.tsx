import { useEffect, useRef, useState } from "react";
import {
  newlyUnlocked,
  pickWeighted,
  shuffle,
  starsForRound,
  unlockedLetterCount,
  unlockedWordCount,
} from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import { LETTER_ORDER, WORDS, letterName, type GarageCar, type WordInfo } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { PitchScene } from "./Scenes";
import { Ball } from "./ThemeItems";
import { SportsCar } from "./SportsCar";
import { useAlive } from "./useAlive";
import { useMyCar } from "./useMyCar";

const WORDS_PER_ROUND = 3;

type Tile = { id: number; letter: string; used: boolean };

function makeWord(prev?: string): { info: WordInfo; tiles: Tile[] } {
  const p = getProgress();
  const unlockedWords = unlockedWordCount(p.words);
  const info = pickWeighted(
    WORDS.slice(0, unlockedWords),
    (w) => p.words[w.word] ?? 0,
    Math.random,
    (w) => w.word === prev,
  );
  const letters = info.word.split("");

  // As he learns more words, add a couple of extra "decoy" letters.
  const extraCount = Math.min(2, Math.floor((unlockedWords - 3) / 5));
  const pool = LETTER_ORDER.slice(0, unlockedLetterCount(p.letters)).filter(
    (l) => !letters.includes(l),
  );
  const extras = shuffle(pool).slice(0, extraCount);

  let order = shuffle([...letters, ...extras]);
  for (let i = 0; i < 6 && order.join("") === info.word; i++) order = shuffle(order);
  return { info, tiles: order.map((letter, id) => ({ id, letter, used: false })) };
}

export function WordGarage({ skin }: { skin?: "soccer" }) {
  return skin === "soccer" ? (
    <GameShell title="Goal Spell" emoji="⚽" bg="pitch" decor={<PitchScene />}>
      <Garage skin="soccer" />
    </GameShell>
  ) : (
    <GameShell title="Word Garage" emoji="🔤">
      <Garage />
    </GameShell>
  );
}

function Garage({ skin }: { skin?: "soccer" }) {
  const alive = useAlive();
  const myCar = useMyCar();
  const perfect = useRef(0);

  const [wordIndex, setWordIndex] = useState(0);
  const [current, setCurrent] = useState(() => makeWord());
  const [tiles, setTiles] = useState<Tile[]>(current.tiles);
  const [filled, setFilled] = useState(0);
  const [mistakes, setMistakes] = useState(0); // mistakes on this word
  const [slotMistakes, setSlotMistakes] = useState(0); // mistakes on this letter
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  const word = current.info.word;
  const lower = word.toLowerCase();
  const expected = word.charAt(filled);

  useEffect(() => {
    preloadClips(voiceGroup("words"));
  }, []);

  // Introduce each new word out loud.
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      void say(`spell_${word}`, `find_${word.charAt(0)}`);
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, done]);

  async function tapTile(tile: Tile) {
    if (tile.used || celebrating || filled >= word.length) return;

    if (tile.letter !== expected) {
      sfx.wrong();
      setShakeId(tile.id);
      window.setTimeout(() => setShakeId(null), 450);
      setMistakes((m) => m + 1);
      setSlotMistakes((m) => m + 1);
      void say(`not_${tile.letter}`, `find_${expected}`);
      return;
    }

    sfx.correct();
    setTiles((ts) => ts.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));
    const next = filled + 1;
    setFilled(next);
    setSlotMistakes(0);

    if (next < word.length) {
      void say(`letter_${tile.letter}`, `find_${word.charAt(next)}`);
      return;
    }

    // Word finished!
    setCelebrating(true);
    const clean = mistakes === 0;
    recordAnswer("words", word, clean);
    if (clean) perfect.current += 1;
    sfx.cheer();
    window.setTimeout(() => sfx.engine(), 350);
    await say(`word_${word}`);
    await sleep(1400);
    if (!alive.current) return;

    if (wordIndex + 1 >= WORDS_PER_ROUND) {
      const before = getProgress().stars;
      const earned = starsForRound(perfect.current, WORDS_PER_ROUND);
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    loadWord(wordIndex + 1, word);
  }

  function loadWord(index: number, prev?: string) {
    const next = makeWord(prev);
    setWordIndex(index);
    setCurrent(next);
    setTiles(next.tiles);
    setFilled(0);
    setMistakes(0);
    setSlotMistakes(0);
    setCelebrating(false);
  }

  function restart() {
    perfect.current = 0;
    setDone(null);
    loadWord(0);
  }

  if (done) return <FinishScreen stars={done.stars} newCars={done.newCars} onAgain={restart} />;

  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-3 pb-6 sm:gap-8 sm:px-8">
      {/* round progress: little cars */}
      <div className="flex gap-2" aria-label={`Word ${wordIndex + 1} of ${WORDS_PER_ROUND}`}>
        {Array.from({ length: WORDS_PER_ROUND }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "text-4xl transition",
              i < wordIndex
                ? "opacity-100"
                : i === wordIndex
                  ? "scale-110"
                  : "opacity-30 grayscale",
            )}
          >
            {i < wordIndex ? "✅" : skin === "soccer" ? "⚽" : "🔧"}
          </span>
        ))}
      </div>

      {/* picture clue */}
      <button
        type="button"
        aria-label={`Say ${lower}`}
        onClick={() => void say(`spell_${word}`)}
        key={word + wordIndex}
        className="pop grid size-44 place-items-center rounded-full bg-white text-[6.5rem] leading-none shadow-xl ring-8 ring-amber-200 active:scale-95 sm:size-60 sm:text-[9rem]"
      >
        <span className={celebrating ? "happy-jump" : "bob"}>{current.info.emoji}</span>
      </button>

      {/* letter slots */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
        {word.split("").map((ch, i) => (
          <div
            key={i}
            className={cn(
              "grid size-[4.5rem] place-items-center rounded-2xl border-4 border-dashed border-sky-400 bg-white/70 text-5xl font-extrabold text-sky-900 sm:size-28 sm:text-7xl",
              i < filled && "pop border-solid border-green-400 bg-white",
              i === filled && !celebrating && "border-amber-400 bg-amber-50",
            )}
          >
            {i < filled ? ch : ""}
          </div>
        ))}
      </div>

      {/* letter tiles to tap */}
      <div className="mt-auto flex flex-wrap justify-center gap-3 sm:gap-5">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={`Letter ${letterName(t.letter)}`}
            disabled={t.used || celebrating}
            onClick={() => void tapTile(t)}
            className={cn(
              skin === "soccer"
                ? "btn-ball relative grid size-24 place-items-center transition active:scale-90 sm:size-32"
                : "grid size-24 place-items-center rounded-3xl bg-gradient-to-b from-rose-400 to-rose-600 text-6xl font-extrabold text-white shadow-xl ring-4 ring-white transition active:scale-90 sm:size-32 sm:text-8xl",
              t.used && "scale-75 opacity-0",
              shakeId === t.id && "shake",
              slotMistakes >= 2 &&
                !t.used &&
                t.letter === expected &&
                "hint rounded-full ring-amber-300",
            )}
          >
            {skin === "soccer" ? (
              <>
                <Ball className="absolute inset-0" />
                <span className="relative grid size-[56%] place-items-center rounded-full bg-white/95 text-4xl font-extrabold leading-none text-slate-900 shadow sm:text-6xl">
                  {t.letter}
                </span>
              </>
            ) : (
              t.letter
            )}
          </button>
        ))}
      </div>

      {/* victory lap when a word is finished */}
      {celebrating && skin === "soccer" && (
        <div
          className="pointer-events-none fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-end gap-2"
          aria-hidden
        >
          <img src="/photos/sonny_storm.webp" alt="" className="kid-cheer h-32 sm:h-52" />
          <img src="/photos/rome_storm.webp" alt="" className="kid-cheer h-32 sm:h-52" />
        </div>
      )}
      {celebrating && skin !== "soccer" && (
        <div
          className="drive-by pointer-events-none fixed bottom-24 left-0 z-30 w-48 sm:w-72"
          aria-hidden
        >
          <SportsCar
            color={myCar.color}
            style={myCar.style}
            stripe={myCar.stripe}
            driving
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
