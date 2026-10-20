import { useEffect, useRef, useState } from "react";
import { maxCountNumber, newlyUnlocked, starsForRound, sumMastery } from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import type { CarStyle, GarageCar } from "@/lib/content";
import { compareAnswer, makeCompare, type CompareQuestion } from "@/lib/counting";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { SportsCar } from "./SportsCar";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;
const STYLES: CarStyle[] = ["coupe", "wedge", "roadster", "hyper"];
const styleAt = (i: number) => STYLES[i % STYLES.length] as CarStyle;

function nextQuestion(): CompareQuestion {
  const p = getProgress();
  // "Which has fewer?" shows up once "more" is going well.
  return makeCompare(maxCountNumber(p.compare), sumMastery(p.compare) >= 6);
}

const promptKey = (q: CompareQuestion) => (q.ask === "more" ? "more_q" : "fewer_q");

export function MoreCars() {
  return (
    <GameShell title="More Cars" emoji="⚖️">
      <Compare />
    </GameShell>
  );
}

function Compare() {
  const alive = useAlive();
  const firstTry = useRef(0);

  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<CompareQuestion>(() => nextQuestion());
  const [status, setStatus] = useState<"ask" | "correct" | "counting">("ask");
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongSide, setWrongSide] = useState<"left" | "right" | null>(null);
  const [counted, setCounted] = useState<{ left: number; right: number }>({ left: 0, right: 0 });
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  const answer = compareAnswer(q);

  useEffect(() => {
    preloadClips(voiceGroup("compare"));
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => void say(promptKey(q)), 400);
    return () => window.clearTimeout(t);
  }, [q, done]);

  async function countSide(side: "left" | "right") {
    const total = q[side];
    await say(side === "left" ? "left_side" : "right_side");
    for (let i = 1; i <= total; i++) {
      if (!alive.current) return;
      setCounted((c) => ({ ...c, [side]: i }));
      sfx.honk();
      await say(`n_${i}`);
      await sleep(150);
    }
  }

  async function pick(side: "left" | "right") {
    if (status !== "ask") return;

    if (side !== answer) {
      if (wrongCount === 0) recordAnswer("compare", String(Math.max(q.left, q.right)), false);
      setWrongCount((n) => n + 1);
      setWrongSide(side);
      sfx.wrong();
      window.setTimeout(() => setWrongSide(null), 600);
      // Count each side together so he can see which one is bigger.
      setStatus("counting");
      setCounted({ left: 0, right: 0 });
      await say("oops", "count_each");
      await countSide("left");
      if (!alive.current) return;
      await sleep(300);
      await countSide("right");
      if (!alive.current) return;
      await sleep(300);
      setStatus("ask");
      setCounted({ left: 0, right: 0 });
      void say(promptKey(q));
      return;
    }

    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("compare", String(Math.max(q.left, q.right)), true);
    }
    setStatus("correct");
    sfx.correct();
    window.setTimeout(() => sfx.engine(), 250);
    await say(q.ask === "more" ? "more_yes" : "fewer_yes", sample(CHEER_KEYS));
    await sleep(600);
    if (!alive.current) return;

    if (qIndex + 1 >= ROUND_LEN) {
      const before = getProgress().stars;
      const earned = starsForRound(firstTry.current, ROUND_LEN);
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    setQIndex(qIndex + 1);
    setQ(nextQuestion());
    setStatus("ask");
    setWrongCount(0);
    setCounted({ left: 0, right: 0 });
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setQ(nextQuestion());
    setStatus("ask");
    setWrongCount(0);
    setCounted({ left: 0, right: 0 });
  }

  if (done) return <FinishScreen stars={done.stars} newCars={done.newCars} onAgain={restart} />;

  const sides = [
    { side: "left" as const, count: q.left, color: q.leftColor },
    { side: "right" as const, count: q.right, color: q.rightColor },
  ];

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
          Which side has{" "}
          <span className={q.ask === "more" ? "text-emerald-600" : "text-rose-500"}>
            {q.ask === "more" ? "MORE" : "FEWER"}
          </span>{" "}
          cars?
        </h2>
      </div>

      <div
        key={qIndex}
        className="pop grid w-full max-w-5xl flex-1 grid-cols-2 items-center gap-3 sm:gap-8"
      >
        {sides.map(({ side, count, color }) => (
          <button
            key={side}
            type="button"
            aria-label={`${side} side`}
            disabled={status !== "ask"}
            onClick={() => void pick(side)}
            className={cn(
              "grid h-[26rem] content-center gap-x-1 gap-y-2 rounded-[2rem] bg-slate-600/90 p-3 shadow-inner ring-8 ring-slate-500/60 transition active:scale-[0.98] sm:h-[32rem] sm:p-6",
              count <= 3 ? "grid-cols-1" : "grid-cols-2",
              status === "correct" && side === answer && "happy-jump ring-green-300",
              wrongSide === side && "shake ring-rose-300",
            )}
          >
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className="relative flex flex-col items-center pt-7">
                <span
                  className={cn(
                    "absolute top-0 grid size-8 place-items-center rounded-full bg-white text-lg font-extrabold text-sky-700 shadow-lg transition sm:size-10 sm:text-2xl",
                    i < counted[side] ? "pop opacity-100" : "scale-50 opacity-0",
                  )}
                >
                  {i + 1}
                </span>
                <SportsCar
                  color={color.hex}
                  style={styleAt(i + (side === "left" ? 0 : 2))}
                  driving={status === "correct" && side === answer}
                  className="w-full"
                />
              </span>
            ))}
          </button>
        ))}
      </div>

      <p className="text-lg font-bold text-sky-900/80 sm:text-2xl">Tap the side you pick!</p>
    </div>
  );
}
