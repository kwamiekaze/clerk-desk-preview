import { useEffect, useRef, useState } from "react";
import { maxCountNumber, newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import type { CarStyle, GarageCar } from "@/lib/content";
import { makeTraffic, numberOptions, type TrafficQuestion } from "@/lib/counting";
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

type Round = { q: TrafficQuestion; options: number[] };

function nextRound(prev?: number): Round {
  const p = getProgress();
  const max = maxCountNumber(p.traffic);
  const q = makeTraffic(max, p.traffic, prev);
  return { q, options: numberOptions(q.n, max) };
}

const promptKey = (q: TrafficQuestion) => `cq_${q.target.name}`;
const numKey = (n: number) => `n_${n}`;

export function TrafficJam() {
  return (
    <GameShell title="Traffic Jam" emoji="🚦">
      <Jam />
    </GameShell>
  );
}

function Jam() {
  const alive = useAlive();
  const firstTry = useRef(0);

  const [qIndex, setQIndex] = useState(0);
  const [round, setRound] = useState<Round>(() => nextRound());
  const [counted, setCounted] = useState<number[]>([]); // car positions counted, in order
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [auto, setAuto] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongNums, setWrongNums] = useState<number[]>([]);
  const [shakeCar, setShakeCar] = useState<number | null>(null);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  const { q, options } = round;
  const isTarget = (i: number) => q.cars[i]?.color.name === q.target.name;

  useEffect(() => {
    preloadClips(voiceGroup("counting"));
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => void say("traffic_q", promptKey(q)), 400);
    return () => window.clearTimeout(t);
  }, [q, done]);

  function tapCar(i: number) {
    if (status !== "ask" || auto) return;
    if (!isTarget(i)) {
      // wrong colour: gentle nudge back to the question
      sfx.wrong();
      setShakeCar(i);
      window.setTimeout(() => setShakeCar(null), 450);
      void say(promptKey(q));
      return;
    }
    const at = counted.indexOf(i);
    sfx.honk();
    if (at >= 0) {
      void say(numKey(at + 1));
      return;
    }
    const next = [...counted, i];
    setCounted(next);
    void say(numKey(next.length));
  }

  async function autoCount() {
    setAuto(true);
    setCounted([]);
    const targets = q.cars.map((_, i) => i).filter(isTarget);
    for (let k = 0; k < targets.length; k++) {
      await sleep(300);
      if (!alive.current) return;
      setCounted(targets.slice(0, k + 1));
      sfx.honk();
      await say(numKey(k + 1));
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
      if (wrongCount === 0) recordAnswer("traffic", String(q.n), false);
      setWrongCount((c) => c + 1);
      setWrongNums((w) => [...w, num]);
      sfx.wrong();
      await say(`no_n_${num}`, "lets_count");
      if (alive.current) await autoCount();
      return;
    }

    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("traffic", String(q.n), true);
    }
    setStatus("correct");
    setCounted(q.cars.map((_, i) => i).filter(isTarget));
    sfx.correct();
    window.setTimeout(() => sfx.engine(), 250);
    await say("yes", numKey(q.n), `${q.n === 1 ? "cr1" : "cr"}_${q.target.name}`);
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
    setRound(nextRound(q.n));
    setCounted([]);
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setRound(nextRound());
    setCounted([]);
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
  }

  if (done) return <FinishScreen stars={done.stars} newCars={done.newCars} onAgain={restart} />;

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-3 pb-6 sm:gap-6 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say("traffic_q", promptKey(q))}
          className="grid size-16 place-items-center rounded-full bg-white text-3xl shadow-lg ring-4 ring-sky-200 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2 className="rounded-3xl bg-white px-5 py-3 text-3xl font-extrabold text-sky-900 shadow-xl ring-4 ring-sky-200 sm:text-5xl">
          How many{" "}
          <span style={{ color: q.target.name === "yellow" ? "#ca8a04" : q.target.hex }}>
            {q.target.name}
          </span>{" "}
          cars?
        </h2>
      </div>

      {/* the traffic jam: only the asked-for colour counts */}
      <div
        key={qIndex}
        className="pop relative flex w-full max-w-4xl flex-1 flex-wrap content-center items-end justify-center gap-x-2 gap-y-3 rounded-[2rem] bg-slate-600/90 p-3 shadow-inner ring-8 ring-slate-500/60 sm:gap-x-4 sm:gap-y-6 sm:p-6"
      >
        {q.cars.map((car, i) => {
          const at = counted.indexOf(i);
          return (
            <button
              key={i}
              type="button"
              aria-label={`${car.color.name} car`}
              onClick={() => tapCar(i)}
              className={cn(
                "relative flex w-[30%] flex-col items-center pt-9 transition active:scale-90 sm:w-[22%]",
                shakeCar === i && "shake",
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
                color={car.color.hex}
                style={STYLES[car.style % STYLES.length] as CarStyle}
                driving={status === "correct" && isTarget(i)}
                className={cn("w-full", at >= 0 && "happy-jump")}
              />
            </button>
          );
        })}
      </div>

      <p className="text-lg font-bold text-sky-900/80 sm:text-2xl">
        Tap only the {q.target.name} cars to count!
      </p>

      <div className="flex justify-center gap-3 sm:gap-6">
        {options.map((num, i) => {
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
