import { useEffect, useRef, useState } from "react";
import {
  at,
  maxCountNumber,
  newlyUnlocked,
  pickWeighted,
  shuffle,
  starsForRound,
} from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import { COLORS, type CarColor, type CarStyle, type GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { SportsCar } from "./SportsCar";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;
const STYLES: CarStyle[] = ["coupe", "wedge", "roadster", "hyper"];
const TILE_COLORS = [
  "from-sky-400 to-sky-600",
  "from-emerald-400 to-emerald-600",
  "from-orange-400 to-orange-600",
];

type Question = { n: number; color: CarColor; options: number[]; styles: CarStyle[] };

function makeQuestion(prevN?: number): Question {
  const p = getProgress();
  const max = maxCountNumber(p.counting);
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  const n = pickWeighted(
    nums,
    (x) => p.counting[String(x)] ?? 0,
    Math.random,
    (x) => x === prevN,
  );
  const pool = Array.from({ length: Math.min(10, max + 1) }, (_, i) => i + 1).filter(
    (x) => x !== n,
  );
  // Prefer numbers close to the answer so he really has to count.
  const near = pool.sort((a, b) => Math.abs(a - n) - Math.abs(b - n)).slice(0, 4);
  const options = shuffle([n, ...shuffle(near).slice(0, 2)]);
  const color = at(COLORS, Math.floor(Math.random() * COLORS.length));
  const styles = Array.from({ length: n }, () =>
    at(STYLES, Math.floor(Math.random() * STYLES.length)),
  );
  return { n, color, options, styles };
}

const promptKey = (q: Question) => `cq_${q.color.name}`;
const numKey = (n: number) => `n_${n}`;

export function CountCars() {
  return (
    <GameShell title="Count Cars" emoji="🔢">
      <Counting />
    </GameShell>
  );
}

function Counting() {
  const alive = useAlive();
  const firstTry = useRef(0);

  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<Question>(() => makeQuestion());
  const [counted, setCounted] = useState<number[]>([]);
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [auto, setAuto] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongNums, setWrongNums] = useState<number[]>([]);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("counting"));
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => void say(promptKey(q)), 400);
    return () => window.clearTimeout(t);
  }, [q, done]);

  function tapCar(i: number) {
    if (status !== "ask" || auto) return;
    const at = counted.indexOf(i);
    if (at >= 0) {
      sfx.honk();
      void say(numKey(at + 1));
      return;
    }
    const next = [...counted, i];
    setCounted(next);
    sfx.honk();
    void say(numKey(next.length));
  }

  async function autoCount() {
    setAuto(true);
    setCounted([]);
    for (let i = 0; i < q.n; i++) {
      await sleep(300);
      if (!alive.current) return;
      setCounted(Array.from({ length: i + 1 }, (_, k) => k));
      sfx.honk();
      await say(numKey(i + 1));
      if (!alive.current) return;
    }
    await sleep(300);
    if (!alive.current) return;
    setAuto(false);
    void say(promptKey(q));
  }

  async function answer(num: number) {
    if (status !== "ask" || auto || wrongNums.includes(num)) return;

    if (num !== q.n) {
      if (wrongCount === 0) recordAnswer("counting", String(q.n), false);
      setWrongCount((c) => c + 1);
      setWrongNums((w) => [...w, num]);
      sfx.wrong();
      await say(`no_n_${num}`, "lets_count");
      if (alive.current) await autoCount();
      return;
    }

    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("counting", String(q.n), true);
    }
    setStatus("correct");
    setCounted(Array.from({ length: q.n }, (_, i) => i));
    sfx.correct();
    window.setTimeout(() => sfx.engine(), 250);
    await say("yes", numKey(q.n), `${q.n === 1 ? "cr1" : "cr"}_${q.color.name}`);
    await sleep(700);
    if (!alive.current) return;

    if (qIndex + 1 >= ROUND_LEN) {
      const before = getProgress().stars;
      const earned = starsForRound(firstTry.current, ROUND_LEN);
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    setQIndex(qIndex + 1);
    setQ(makeQuestion(q.n));
    setCounted([]);
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setQ(makeQuestion());
    setCounted([]);
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
  }

  if (done) return <FinishScreen stars={done.stars} newCars={done.newCars} onAgain={restart} />;

  const big = q.n <= 3;
  const medium = q.n <= 6;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-3 pb-6 sm:gap-6 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(promptKey(q))}
          className="grid size-16 place-items-center rounded-full bg-white text-3xl shadow-lg ring-4 ring-sky-200 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2 className="rounded-3xl bg-white px-5 py-3 text-3xl font-extrabold text-sky-900 shadow-xl ring-4 ring-sky-200 sm:text-5xl">
          How many{" "}
          <span style={{ color: q.color.name === "yellow" ? "#ca8a04" : q.color.hex }}>
            {q.color.name}
          </span>{" "}
          cars?
        </h2>
      </div>

      {/* the cars to count: tap each one */}
      <div
        key={qIndex}
        className="pop relative flex w-full max-w-4xl flex-1 flex-wrap content-center items-end justify-center gap-x-2 gap-y-3 rounded-[2rem] bg-slate-600/90 p-3 shadow-inner ring-8 ring-slate-500/60 sm:gap-x-4 sm:gap-y-6 sm:p-6"
      >
        <div className="pointer-events-none absolute inset-x-6 top-1/2 border-t-4 border-dashed border-white/30" />
        {q.styles.map((style, i) => {
          const at = counted.indexOf(i);
          return (
            <button
              key={i}
              type="button"
              aria-label={`${q.color.name} car`}
              onClick={() => tapCar(i)}
              className={cn(
                "relative flex flex-col items-center pt-9 transition active:scale-90",
                big ? "w-[44%] sm:w-[30%]" : medium ? "w-[30%] sm:w-[24%]" : "w-[30%] sm:w-[17%]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0 grid size-10 place-items-center rounded-full bg-white text-2xl font-extrabold text-sky-700 shadow-lg transition sm:size-12 sm:text-3xl",
                  at >= 0 ? "pop opacity-100" : "scale-50 opacity-0",
                )}
              >
                {at >= 0 ? at + 1 : ""}
              </span>
              <SportsCar
                color={q.color.hex}
                style={style}
                driving={status === "correct"}
                className={cn("w-full", at >= 0 && "happy-jump")}
              />
            </button>
          );
        })}
      </div>

      <p className="text-lg font-bold text-sky-900/80 sm:text-2xl">
        Tap each car to count, then pick the number!
      </p>

      {/* number answers */}
      <div className="flex justify-center gap-3 sm:gap-6">
        {q.options.map((num, i) => {
          const wrong = wrongNums.includes(num);
          return (
            <button
              key={num}
              type="button"
              aria-label={String(num)}
              disabled={wrong || status === "correct" || auto}
              onClick={() => void answer(num)}
              className={cn(
                "grid size-24 place-items-center rounded-3xl bg-gradient-to-b text-7xl font-extrabold text-white shadow-xl ring-4 ring-white transition active:scale-90 sm:size-36 sm:text-9xl",
                TILE_COLORS[i % TILE_COLORS.length],
                wrong && "shake scale-90 opacity-40",
                status === "correct" && num === q.n && "happy-jump ring-green-300",
                wrongCount >= 2 &&
                  num === q.n &&
                  status === "ask" &&
                  !auto &&
                  "hint ring-amber-300",
              )}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
