import { useEffect, useMemo, useRef, useState } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import type { GarageCar } from "@/lib/content";
import {
  makeNumber,
  NUM_TIER_NAMES,
  numKey,
  numOptions,
  numTier,
  type NumQuestion,
} from "@/lib/numbers";
import { addStars, getProgress, recordAnswer, useProgress } from "@/lib/progress";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { BubblesScene } from "./Scenes";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;
const PROMPT: Record<NumQuestion["kind"], string> = {
  next: "nt_next",
  missing: "nt_miss",
  before: "nt_before",
  big: "nt_big",
  small: "nt_small",
};
const HEAD: Record<NumQuestion["kind"], string> = {
  next: "What comes next?",
  missing: "What is missing?",
  before: "What comes before?",
  big: "Which is bigger?",
  small: "Which is smaller?",
};
const WAGON = ["bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-violet-400"];

export function NumberTrain() {
  return (
    <GameShell title="Number Train" emoji="🚂" bg="train" decor={<BubblesScene />}>
      <Play />
    </GameShell>
  );
}

function Wagon({ n, i, ask, pop }: { n: number | null; i: number; ask?: boolean; pop?: boolean }) {
  return (
    <div className="flex items-end">
      <div
        className={cn(
          "grid size-[3.1rem] place-items-center rounded-xl text-3xl font-extrabold text-white shadow-lg ring-[3px] ring-white/80 sm:size-24 sm:rounded-2xl sm:text-6xl sm:ring-4",
          n === null
            ? "kid-idle border-4 border-dashed border-white bg-white/40 text-sky-900"
            : (WAGON[i % WAGON.length] ?? "bg-rose-400"),
          pop && "happy-jump",
        )}
        style={{ textShadow: "0 3px 0 rgba(0,0,0,0.22)" }}
      >
        {n === null || ask ? "?" : n}
      </div>
      <span className="-mb-1 h-2 w-2 bg-slate-700 sm:w-3" />
    </div>
  );
}

function Play() {
  const alive = useAlive();
  const progress = useProgress();
  const firstTry = useRef(0);
  const lastKey = useRef<string | undefined>(undefined);
  const greeted = useRef(false);

  const makeQ = (): NumQuestion => {
    const p = getProgress();
    const q = makeNumber(numTier(p.numbers), p.numbers, lastKey.current);
    lastKey.current = `${q.kind}${q.kind === "before" ? q.start - 1 : q.answer}`;
    return q;
  };
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<NumQuestion>(() => makeQ());
  const tier = numTier(progress.numbers);
  const max = tier === 3 ? 20 : tier === 0 ? 5 : 10;
  const options = useMemo(
    () => (q.kind === "big" || q.kind === "small" ? [] : numOptions(q.answer, max)),
    [q, max],
  );
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongNums, setWrongNums] = useState<number[]>([]);
  const [cheer, setCheer] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  const lines = useMemo(() => {
    const read =
      q.kind === "next"
        ? q.seq.map((n) => `n_${n}`)
        : q.kind === "missing"
          ? q.seq.filter((n): n is number => n !== null).map((n) => `n_${n}`)
          : q.kind === "before"
            ? [`n_${q.start}`]
            : [];
    return [PROMPT[q.kind], ...read];
  }, [q]);

  useEffect(() => {
    preloadClips(voiceGroup("numbers"));
  }, []);
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const first = greeted.current ? [] : ["nt_hello"];
      greeted.current = true;
      void say(...first, ...lines);
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, done]);

  async function answer(num: number) {
    if (status !== "ask" || wrongNums.includes(num)) return;
    const key = numKey(q);
    if (num !== q.answer) {
      if (wrongCount === 0) recordAnswer("numbers", key, false);
      setWrongCount((c) => c + 1);
      setWrongNums((w) => [...w, num]);
      sfx.wrong();
      void say("try_again", PROMPT[q.kind]);
      return;
    }
    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("numbers", key, true);
    }
    setStatus("correct");
    sfx.correct();
    setCheer(true);
    sfx.honk();
    await say("yes", `n_${q.answer}`);
    await sleep(500);
    if (!alive.current) return;
    setCheer(false);
    await sleep(300);
    if (qIndex + 1 >= ROUND_LEN) {
      const before = getProgress().stars;
      const earned = starsForRound(firstTry.current, ROUND_LEN);
      sfx.cheer();
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    setQIndex(qIndex + 1);
    setQ(makeQ());
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
  }

  function restart() {
    firstTry.current = 0;
    lastKey.current = undefined;
    setDone(null);
    setQIndex(0);
    setQ(makeQ());
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        hero={
          <img
            src="/photos/sonny_shades2.webp"
            alt="Sonny John"
            className="pop kid-cheer h-56 drop-shadow-xl sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  const correct = status === "correct";
  const cars: (number | null)[] =
    q.kind === "next"
      ? [...q.seq, null]
      : q.kind === "missing"
        ? q.seq
        : q.kind === "before"
          ? [null, q.start]
          : [];

  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-3 pb-3 sm:gap-4 sm:px-8">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(...lines)}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 ring-violet-300 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2
          key={qIndex}
          className="pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-3xl font-extrabold text-violet-950 shadow-xl ring-4 ring-violet-300 sm:text-6xl"
        >
          {HEAD[q.kind]}
        </h2>
      </div>

      <div
        className="flex items-center gap-1.5"
        aria-label={`Question ${qIndex + 1} of ${ROUND_LEN}`}
      >
        {Array.from({ length: ROUND_LEN }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "grid size-8 place-items-center rounded-full text-lg sm:size-10",
              i < qIndex || (i === qIndex && correct)
                ? "bg-white shadow-lg"
                : "bg-white/40 ring-1 ring-white",
            )}
          >
            {i < qIndex || (i === qIndex && correct) ? "⭐" : ""}
          </span>
        ))}
        <span className="ml-2 hidden text-sm font-bold text-violet-950/70 sm:block">
          {NUM_TIER_NAMES[tier]}
        </span>
      </div>

      {/* the train */}
      <div
        key={qIndex}
        className="pop relative flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-4 rounded-[2rem] bg-white/25 p-3 shadow-inner ring-2 ring-white/60 sm:p-6"
      >
        {q.kind === "big" || q.kind === "small" ? (
          <div className="grid w-full grid-cols-2 gap-4 sm:gap-8">
            {[q.a, q.b].map((n, i) => {
              const wrong = wrongNums.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n}`}
                  onClick={() => void answer(n)}
                  disabled={wrong}
                  className={cn(
                    "relative grid aspect-square place-items-center rounded-[2rem] text-[clamp(4rem,22vw,9rem)] font-extrabold leading-none text-white shadow-xl ring-8 ring-white transition active:scale-90",
                    i ? "bg-sky-500" : "bg-rose-500",
                    wrong && "shake scale-90 opacity-40",
                    correct && n === q.answer && "happy-jump",
                    wrongCount >= 2 && n === q.answer && !correct && "hint",
                  )}
                  style={{ textShadow: "0 5px 0 rgba(0,0,0,0.25)" }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex w-full items-end justify-center gap-1 overflow-hidden sm:gap-3">
            <span className="text-5xl sm:text-8xl" aria-hidden>
              🚂
            </span>
            {cars.map((n, i) => (
              <Wagon
                key={i}
                n={n === null && correct ? q.answer : n}
                i={i}
                {...(correct && n === null ? { pop: true } : {})}
              />
            ))}
          </div>
        )}
        <div className="h-3 w-full rounded-full bg-slate-700/70 sm:h-4" />
      </div>

      <div className="flex w-full max-w-4xl items-end gap-2 sm:gap-6">
        <img
          key={cheer ? "win" : "idle"}
          src={cheer ? "/photos/sonny_shades2.webp" : "/photos/sonny_shades1.webp"}
          alt="Sonny John"
          draggable={false}
          className={cn("w-24 shrink-0 drop-shadow-xl sm:w-40", cheer ? "kid-cheer" : "kid-idle")}
        />
        {options.length > 0 ? (
          <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-5">
            {options.map((n, i) => {
              const wrong = wrongNums.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n}`}
                  onClick={() => void answer(n)}
                  disabled={wrong}
                  className={cn(
                    "grid aspect-square place-items-center rounded-full text-[clamp(2.4rem,11vw,4.6rem)] font-extrabold leading-none text-white shadow-xl ring-4 ring-white transition active:scale-90",
                    ["bg-emerald-500", "bg-orange-500", "bg-fuchsia-500"][i % 3],
                    wrong && "shake scale-90 opacity-40",
                    correct && n === q.answer && "happy-jump",
                    wrongCount >= 2 && n === q.answer && !correct && "hint",
                  )}
                  style={{ textShadow: "0 3px 0 rgba(0,0,0,0.25)" }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="flex-1 pb-4 text-center text-xl font-extrabold text-violet-950 sm:text-3xl">
            Tap the {q.kind === "big" ? "bigger" : "smaller"} number!
          </p>
        )}
      </div>
    </div>
  );
}

