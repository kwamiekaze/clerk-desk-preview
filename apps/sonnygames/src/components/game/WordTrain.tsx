import { useEffect, useMemo, useRef, useState } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import { COLORS, type GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { nameCheer } from "@/lib/vocab";
import { voiceGroup } from "@/lib/voice-groups";
import { CHEER_KEYS } from "@/lib/voice-lines";
import {
  crateLetters,
  dropCars,
  makeTrainWords,
  trainLevel,
  type TrainLevel,
  type TrainWord,
} from "@/lib/wordtrain";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { Clouds, GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

const WORDS_PER_TRIP = 3;
const PHOTO = "/photos/train.webp";
const CAR_COLORS = ["bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-violet-400"];

export function WordTrain() {
  return (
    <GameShell title="Word Train" emoji="🚂" bg="train" decor={<Clouds />}>
      <Play />
    </GameShell>
  );
}

/** Sonny John in the engine cab - never cropped. */
function Engineer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-sky-200 shadow-lg ring-4 ring-white",
        className,
      )}
    >
      <img
        src={PHOTO}
        alt="Engineer Sonny John driving the train"
        className="size-full object-contain"
        draggable={false}
      />
    </div>
  );
}

function Wheels() {
  return (
    <div className="pointer-events-none absolute inset-x-2 -bottom-2 flex justify-between">
      <span className="size-4 rounded-full bg-slate-700 ring-2 ring-white" />
      <span className="size-4 rounded-full bg-slate-700 ring-2 ring-white" />
    </div>
  );
}

/** A train car carrying one letter. */
function LetterCar({
  letter,
  i,
  size = "sm",
  empty,
  ...rest
}: {
  letter?: string;
  i: number;
  size?: "sm" | "lg";
  empty?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...props } = rest;
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-xl font-extrabold text-white shadow-lg ring-[3px] ring-white/80",
        size === "lg" ? "size-[4.75rem] text-5xl" : "size-12 text-3xl",
        empty
          ? "border-4 border-dashed border-white bg-white/40"
          : (CAR_COLORS[i % CAR_COLORS.length] ?? "bg-rose-400"),
        className,
      )}
      style={{ textShadow: "0 3px 0 rgba(0,0,0,0.22)" }}
      {...props}
    >
      {empty ? "" : letter}
      {!empty && <Wheels />}
    </div>
  );
}

/** Rails with sleepers that slide past while the train rides. */
function Rails({ moving }: { moving: boolean }) {
  return (
    <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-500">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #92400e 0 12px, transparent 12px 48px)",
          backgroundSize: "96px 100%",
          animation: moving ? "rails 0.45s linear infinite" : undefined,
        }}
      />
    </div>
  );
}

const SCENERY = ["🌳", "🏠", "⛰️", "🌲", "🐄", "🏡", "🌻", "🌳"];

function Scenery() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-1/3 h-24 overflow-hidden"
      aria-hidden
    >
      {SCENERY.map((e, i) => (
        <span
          key={i}
          className="absolute bottom-0 text-5xl"
          style={{
            animation: `scenery ${2.4}s linear ${-i * 0.3}s infinite`,
            animationFillMode: "both",
          }}
        >
          {e}
        </span>
      ))}
    </div>
  );
}

type Phase = "pick" | "ride" | "drop" | "next";

function Play() {
  const alive = useAlive();
  const firstTry = useRef(0);
  const greeted = useRef(false);

  const [level] = useState<TrainLevel>(() => trainLevel(getProgress().wordtrain));
  const words = useMemo<TrainWord[]>(
    () => makeTrainWords(getProgress().wordtrain, WORDS_PER_TRIP),
    [],
  );
  const [wi, setWi] = useState(0);
  const word = words[wi] as TrainWord;
  const letters = word.word.split("");

  const [phase, setPhase] = useState<Phase>("pick");
  const [loaded, setLoaded] = useState(0); // letters picked up so far
  const [wrongCrates, setWrongCrates] = useState<string[]>([]);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [wrongHere, setWrongHere] = useState(0);
  const [placed, setPlaced] = useState(0); // letters dropped so far
  const [used, setUsed] = useState<number[]>([]); // car ids already dropped
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  const crates = useMemo(
    () => (loaded < letters.length ? crateLetters(word.word, loaded, level.crates) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wi, loaded, level.crates],
  );
  const cars = useMemo(
    () => dropCars(word.word, level.mixed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wi, level.mixed],
  );
  const crateColors = useMemo(
    () => COLORS.map((c) => c.hex).sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wi, loaded],
  );

  useEffect(() => {
    preloadClips(voiceGroup("wordtrain"));
  }, []);

  const needed = letters[phase === "pick" ? loaded : placed] ?? "";
  const promptKey = phase === "pick" ? `tp_${needed}` : level.say ? `td_${needed}` : "tw_spellit";

  // Say the introduction when a new word starts, then ask for the first letter.
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const first = greeted.current ? [] : ["tw_start"];
      greeted.current = true;
      void say(...first, word.intro, `tp_${letters[0]}`);
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wi, done]);

  const replay = () => {
    sfx.tap();
    void say(promptKey);
  };

  async function pick(letter: string) {
    if (phase !== "pick" || busy || wrongCrates.includes(letter)) return;
    sfx.unlock();
    if (letter !== needed) {
      setMistakes((m) => m + 1);
      setWrongCrates((w) => [...w, letter]);
      setShakeKey(letter);
      sfx.wrong();
      void say("try_again", promptKey);
      return;
    }
    setBusy(true);
    sfx.clunk();
    sfx.correct();
    const next = loaded + 1;
    setLoaded(next);
    setWrongCrates([]);
    if (next < letters.length) {
      await sleep(450);
      if (!alive.current) return;
      setBusy(false);
      void say(`tp_${letters[next]}`);
      return;
    }
    // all loaded: cheer, then ride to Word Town
    await say(nameCheer());
    if (!alive.current) return;
    setPhase("ride");
    sfx.whistle();
    sfx.chug();
    await Promise.all([say("tw_toword"), sleep(2600)]);
    if (!alive.current) return;
    setPhase("drop");
    setWrongHere(0);
    setBusy(false);
    void say(level.say ? `td_${letters[0]}` : "tw_spellit");
  }

  async function drop(id: number, letter: string) {
    if (phase !== "drop" || busy || used.includes(id)) return;
    sfx.unlock();
    if (letter !== needed) {
      setMistakes((m) => m + 1);
      setShakeKey(`car${id}`);
      const w = wrongHere + 1;
      setWrongHere(w);
      sfx.wrong();
      void say("try_again", level.say || w >= 2 ? `td_${needed}` : "tw_spellit");
      return;
    }
    setBusy(true);
    sfx.clunk();
    sfx.correct();
    const n = placed + 1;
    setPlaced(n);
    setUsed((u) => [...u, id]);
    setWrongHere(0);
    if (n < letters.length) {
      await sleep(450);
      if (!alive.current) return;
      setBusy(false);
      void say(level.say ? `td_${letters[n]}` : "tw_spellit");
      return;
    }
    // word complete
    const clean = mistakes === 0;
    recordAnswer("wordtrain", word.id, clean);
    if (clean) firstTry.current += 1;
    sfx.honk();
    sfx.whistle();
    setPhase("next");
    await say(word.done, nameCheer(), sample(CHEER_KEYS));
    await sleep(500);
    if (!alive.current) return;
    if (wi + 1 >= words.length) {
      const before = getProgress().stars;
      const earned = starsForRound(firstTry.current, words.length);
      sfx.cheer();
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    setWi((i) => i + 1);
    setPhase("pick");
    setLoaded(0);
    setPlaced(0);
    setUsed([]);
    setMistakes(0);
    setWrongHere(0);
    setWrongCrates([]);
    setBusy(false);
  }

  if (done) {
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        headline="All aboard, Sonny John!"
        hero={<Engineer className="pop h-64 w-48 sm:h-80 sm:w-60" />}
        onAgain={() => window.location.reload()}
      />
    );
  }

  const spellHint = !level.say && wrongHere >= 2 ? needed : null;

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-3 p-3 sm:max-w-xl">
      {phase === "ride" && <Scenery />}

      {/* engineer + prompt */}
      <div className="flex items-center gap-3">
        <Engineer className={cn("h-28 w-[5.25rem]", phase === "ride" && "bob")} />
        <button
          type="button"
          onClick={replay}
          className="flex-1 rounded-3xl bg-white/95 p-3 text-left shadow-lg ring-4 ring-amber-200 active:scale-95"
        >
          <div className="flex gap-1.5 pb-1" aria-label={`Word ${wi + 1} of ${words.length}`}>
            {words.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 flex-1 rounded-full",
                  i < wi ? "bg-green-500" : i === wi ? "bg-amber-400" : "bg-slate-200",
                )}
              />
            ))}
          </div>
          <p className="text-lg font-extrabold leading-tight text-sky-900 sm:text-2xl">
            {phase === "pick" && (
              <>
                📦 Pick up the letter <span className="text-3xl text-rose-500">{needed}</span>
              </>
            )}
            {phase === "ride" && <>🚂 Choo choo! Off to Word Town!</>}
            {(phase === "drop" || phase === "next") &&
              (level.say ? (
                <>
                  🏘️ Drop off the letter <span className="text-3xl text-rose-500">{needed}</span>
                </>
              ) : (
                <>🏘️ Spell the word! What comes next?</>
              ))}
          </p>
        </button>
      </div>

      {/* pick-up: Letter Station */}
      {phase === "pick" && (
        <section className="rounded-3xl bg-amber-100/90 p-3 shadow-xl ring-4 ring-amber-300">
          <p className="pb-2 text-center text-base font-extrabold text-amber-800">
            🏭 Letter Station
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {crates.map((l, i) => (
              <button
                key={`${loaded}${l}`}
                type="button"
                disabled={wrongCrates.includes(l)}
                onClick={() => void pick(l)}
                aria-label={`Letter ${l}`}
                onAnimationEnd={() => setShakeKey(null)}
                className={cn(
                  "grid size-[5.5rem] place-items-center rounded-2xl text-6xl font-extrabold text-white shadow-lg ring-4 ring-amber-900/30 transition active:scale-90 disabled:opacity-30",
                  shakeKey === l && "shake",
                  l === needed && wrongCrates.length >= 2 && "hint",
                )}
                style={{
                  backgroundColor: crateColors[i % crateColors.length],
                  textShadow: "0 3px 0 rgba(0,0,0,0.25)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* drop-off: Word Town */}
      {(phase === "drop" || phase === "next") && (
        <section className="rounded-3xl bg-emerald-100/95 p-3 shadow-xl ring-4 ring-emerald-400">
          <p className="pb-2 text-center text-base font-extrabold text-emerald-800">🏘️ Word Town</p>
          <div className="mx-auto flex w-fit flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-md ring-4 ring-sky-200">
            {word.photo ? (
              <img src={PHOTO} alt="" className="h-20 w-16 object-contain" draggable={false} />
            ) : (
              <span className="text-7xl" aria-hidden>
                {word.emoji}
              </span>
            )}
            <div className="flex gap-1.5">
              {letters.map((l, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid size-12 place-items-center rounded-lg border-4 text-3xl font-extrabold",
                    i < placed
                      ? "pop border-green-500 bg-green-100 text-green-700"
                      : "border-dashed border-sky-300 bg-sky-50 text-transparent",
                    i === placed && phase === "drop" && "kid-idle",
                  )}
                >
                  {i < placed ? l : "_"}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* the train: loaded letters while picking up, tappable cars while dropping off */}
      <div className="mt-auto pb-2">
        {phase !== "ride" && (
          <div className="flex items-end justify-around pb-1 text-4xl opacity-90" aria-hidden>
            {["🌳", "🏠", "🌲", "⛰️", "🏡", "🌳"].map((e, i) => (
              <span key={i} className={i % 2 ? "text-5xl" : ""}>
                {e}
              </span>
            ))}
          </div>
        )}
        {phase === "drop" || phase === "next" ? (
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-4 pb-1">
            {cars.map((c, i) =>
              used.includes(c.id) ? (
                <LetterCar key={c.id} i={i} size="lg" empty />
              ) : (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Letter ${c.letter}`}
                  onClick={() => void drop(c.id, c.letter)}
                  onAnimationEnd={() => setShakeKey(null)}
                  className="active:scale-90"
                >
                  <LetterCar
                    letter={c.letter}
                    i={i}
                    size="lg"
                    className={cn(
                      shakeKey === `car${c.id}` && "shake",
                      spellHint === c.letter && "hint",
                    )}
                  />
                </button>
              ),
            )}
          </div>
        ) : null}
        <div
          className={cn("flex items-end justify-start gap-1", phase === "ride" && "justify-center")}
          style={phase === "ride" ? { animation: "chug 0.32s ease-in-out infinite" } : undefined}
        >
          <span className="text-6xl" aria-hidden>
            🚂
          </span>
          {phase !== "drop" && phase !== "next"
            ? letters.map((l, i) => (
                <LetterCar key={i} letter={l} i={i} empty={i >= loaded} className="pop" />
              ))
            : null}
        </div>
        <Rails moving={phase === "ride"} />
      </div>
    </div>
  );
}
