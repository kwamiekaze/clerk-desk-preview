import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  maxCountNumber,
  newlyUnlocked,
  pickWeighted,
  shuffle,
  starsForRound,
} from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

export type CountingTheme = {
  title: string;
  emoji: string;
  sonny: string;
  background: string;
  panel: string;
  itemSets: Array<{ name: string; singular: string; emoji: string }>;
};

const ROUND_LEN = 5;
const TILE_COLORS = [
  "from-sky-400 to-sky-600",
  "from-emerald-400 to-emerald-600",
  "from-orange-400 to-orange-600",
];

type Question = { n: number; options: number[]; set: CountingTheme["itemSets"][number] };

function makeQuestion(theme: CountingTheme, previous?: string): Question {
  const progress = getProgress();
  const max = maxCountNumber(progress.counting);
  const choices = Array.from({ length: max }, (_, i) => i + 1);
  const n = pickWeighted(choices, (value) => progress.counting[String(value)] ?? 0, Math.random);
  const nearby = Array.from({ length: Math.min(10, max + 1) }, (_, i) => i + 1)
    .filter((value) => value !== n)
    .sort((a, b) => Math.abs(a - n) - Math.abs(b - n));
  const available = theme.itemSets.filter((set) => set.name !== previous);
  const set = available[Math.floor(Math.random() * available.length)] ?? theme.itemSets[0]!;
  return { n, set, options: shuffle([n, ...shuffle(nearby.slice(0, 4)).slice(0, 2)]) };
}

export function ThemeCounting({ theme }: { theme: CountingTheme }) {
  return (
    <GameShell title={theme.title} emoji={theme.emoji}>
      <CountingRound theme={theme} />
    </GameShell>
  );
}

function CountingRound({ theme }: { theme: CountingTheme }) {
  const alive = useAlive();
  const firstTry = useRef(0);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState(() => makeQuestion(theme));
  const [counted, setCounted] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [auto, setAuto] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [done, setDone] = useState<ComponentProps<typeof FinishScreen> | null>(null);

  useEffect(() => preloadClips(voiceGroup("counting")), []);
  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => void say("lets_count"), 350);
    return () => window.clearTimeout(timer);
  }, [question, done]);

  function tapItem(index: number) {
    if (correct || auto) return;
    const existing = counted.indexOf(index);
    if (existing >= 0) {
      void say(`n_${existing + 1}`);
      return;
    }
    const next = [...counted, index];
    setCounted(next);
    sfx.tap();
    void say(`n_${next.length}`);
  }

  async function countTogether() {
    setAuto(true);
    setCounted([]);
    for (let i = 0; i < question.n; i++) {
      await sleep(280);
      if (!alive.current) return;
      setCounted(Array.from({ length: i + 1 }, (_, index) => index));
      sfx.tap();
      await say(`n_${i + 1}`);
    }
    if (alive.current) setAuto(false);
  }

  async function answer(value: number) {
    if (correct || auto || wrong.includes(value)) return;
    if (value !== question.n) {
      if (!wrong.length) recordAnswer("counting", String(question.n), false);
      setWrong((values) => [...values, value]);
      sfx.wrong();
      await say(`no_n_${value}`, "lets_count");
      if (alive.current) await countTogether();
      return;
    }

    if (!wrong.length) {
      firstTry.current += 1;
      recordAnswer("counting", String(question.n), true);
    }
    setCorrect(true);
    setCounted(Array.from({ length: question.n }, (_, index) => index));
    sfx.correct();
    await say("yes", `n_${question.n}`);
    await sleep(650);
    if (!alive.current) return;

    if (round + 1 >= ROUND_LEN) {
      const before = getProgress().stars;
      const stars = starsForRound(firstTry.current, ROUND_LEN);
      addStars(stars);
      setDone({ stars, newCars: newlyUnlocked(before, before + stars), onAgain: restart });
      return;
    }
    setRound((value) => value + 1);
    setQuestion(makeQuestion(theme, question.set.name));
    setCounted([]);
    setWrong([]);
    setCorrect(false);
  }

  function restart() {
    firstTry.current = 0;
    setRound(0);
    setQuestion(makeQuestion(theme));
    setCounted([]);
    setWrong([]);
    setCorrect(false);
    setDone(null);
  }

  if (done) return <FinishScreen {...done} />;

  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col items-center gap-3 overflow-hidden px-3 pb-5 sm:gap-5 sm:px-8",
        theme.background,
      )}
    >
      <div className="flex w-full max-w-5xl items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Count together"
          onClick={() => void countTogether()}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-3xl shadow-lg ring-4 ring-white/60 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2 className="flex-1 rounded-3xl bg-white/95 px-4 py-3 text-center text-2xl font-extrabold text-slate-800 shadow-xl ring-4 ring-white/60 sm:text-5xl">
          How many {question.set.name}?
        </h2>
        <span className="rounded-full bg-white/90 px-3 py-2 text-lg font-black text-slate-700 shadow sm:text-2xl">
          {round + 1}/{ROUND_LEN}
        </span>
      </div>

      <div
        className={cn(
          "relative grid w-full max-w-5xl flex-1 grid-cols-[minmax(105px,30%)_1fr] items-center gap-2 overflow-hidden rounded-[2rem] p-3 shadow-2xl ring-8 ring-white/50 sm:grid-cols-[minmax(220px,32%)_1fr] sm:gap-6 sm:p-6",
          theme.panel,
        )}
      >
        <div className="relative flex h-full min-h-48 items-end justify-center">
          <div className="absolute inset-x-2 bottom-2 h-8 rounded-[50%] bg-black/15 blur-md" />
          <img
            src={theme.sonny}
            alt={`Sonny John — ${theme.title}`}
            className="relative z-10 max-h-[48vh] w-full object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.35)]"
          />
        </div>
        <div className="flex flex-wrap content-center justify-center gap-2 sm:gap-4">
          {Array.from({ length: question.n }, (_, index) => {
            const order = counted.indexOf(index);
            return (
              <button
                key={`${round}-${index}`}
                type="button"
                aria-label={question.set.singular}
                onClick={() => tapItem(index)}
                className={cn(
                  "pop relative grid size-20 place-items-center rounded-3xl bg-white/90 text-5xl shadow-lg ring-4 ring-white transition active:scale-90 sm:size-28 sm:text-7xl",
                  order >= 0 && "happy-jump ring-amber-300",
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                {question.set.emoji}
                <span
                  className={cn(
                    "absolute -right-2 -top-2 grid size-9 place-items-center rounded-full bg-sky-600 text-xl font-black text-white shadow transition sm:size-11 sm:text-2xl",
                    order < 0 && "scale-50 opacity-0",
                  )}
                >
                  {order + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-3 sm:gap-6">
        {question.options.map((value, index) => {
          const missed = wrong.includes(value);
          return (
            <button
              key={value}
              type="button"
              disabled={missed || correct || auto}
              onClick={() => void answer(value)}
              className={cn(
                "grid size-24 place-items-center rounded-3xl bg-gradient-to-b text-7xl font-extrabold text-white shadow-xl ring-4 ring-white transition active:scale-90 sm:size-32 sm:text-8xl",
                TILE_COLORS[index % TILE_COLORS.length],
                missed && "shake scale-90 opacity-35",
                correct && value === question.n && "happy-jump ring-green-300",
                wrong.length >= 2 && value === question.n && !auto && "hint ring-amber-300",
              )}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
