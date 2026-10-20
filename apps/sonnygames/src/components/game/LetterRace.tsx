import { useEffect, useRef, useState } from "react";
import {
  at,
  newlyUnlocked,
  pickWeighted,
  shuffle,
  starsForRound,
  unlockedLetterCount,
} from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import {
  COLORS,
  LETTERS,
  letterName,
  type CarStyle,
  type GarageCar,
  WORDS,
  type LetterInfo,
  type WordInfo,
} from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { SportsCar } from "./SportsCar";
import { useAlive } from "./useAlive";
import { useMyCar } from "./useMyCar";

const ROUND_LEN = 6;
const STYLES: CarStyle[] = ["coupe", "wedge", "roadster", "hyper"];

type Option = { letter: string; color: string; style: CarStyle };
type Question = {
  target: LetterInfo;
  options: Option[];
  lower: boolean;
  /** when set, we ask "which letter does <word> start with?" instead of "find the letter" */
  word?: WordInfo;
};

function makeQuestion(prevTarget?: string, index = 0): Question {
  const p = getProgress();
  const unlocked = LETTERS.slice(0, unlockedLetterCount(p.letters));
  const target = pickWeighted(
    unlocked,
    (l) => p.letters[l.letter] ?? 0,
    Math.random,
    (l) => l.letter === prevTarget,
  );
  const others = shuffle(unlocked.filter((l) => l.letter !== target.letter)).slice(0, 3);
  const colors = shuffle(COLORS);
  const styles = shuffle(STYLES);
  const options = shuffle([target, ...others]).map((l, i) => ({
    letter: l.letter,
    color: at(colors, i).hex,
    style: at(styles, i),
  }));
  // Harder questions after the warm-up: little letters and "which letter starts this word?"
  const warm = index >= 1;
  const words = WORDS.filter((w) => w.word.charAt(0) === target.letter);
  const word = warm && words.length > 0 && Math.random() < 0.4 ? sample(words) : undefined;
  const lower = !word && warm && Math.random() < 0.35;
  return word ? { target, options, lower: false, word } : { target, options, lower };
}

const promptKey = (q: Question) =>
  q.word ? `starts_${q.word.word}` : `${q.lower ? "findlow" : "find"}_${q.target.letter}`;

export function LetterRace() {
  return (
    <GameShell title="ABC Race" emoji="🏁">
      <Race />
    </GameShell>
  );
}

function Race() {
  const alive = useAlive();
  const myCar = useMyCar();
  const firstTry = useRef(0);

  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<Question>(() => makeQuestion());
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongLetters, setWrongLetters] = useState<string[]>([]);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("letters"));
  }, []);

  // Ask the question out loud whenever a new one appears.
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => void say(promptKey(q)), 400);
    return () => window.clearTimeout(t);
  }, [q, done]);

  const show = (letter: string) => (q.lower ? letter.toLowerCase() : letter);

  async function pick(opt: Option) {
    if (status !== "ask" || wrongLetters.includes(opt.letter)) return;
    const t = q.target;

    if (opt.letter !== t.letter) {
      if (wrongCount === 0) recordAnswer("letters", t.letter, false);
      setWrongCount((n) => n + 1);
      setWrongLetters((w) => [...w, opt.letter]);
      sfx.wrong();
      void say(`not_${opt.letter}`, "try_again", promptKey(q));
      return;
    }

    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("letters", t.letter, true);
    }
    setStatus("correct");
    sfx.correct();
    window.setTimeout(() => sfx.engine(), 250);
    await say(sample(CHEER_KEYS), `sound_${t.letter}`);
    await sleep(500);
    if (!alive.current) return;

    if (qIndex + 1 >= ROUND_LEN) {
      const before = getProgress().stars;
      const earned = starsForRound(firstTry.current, ROUND_LEN);
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    setQIndex(qIndex + 1);
    setQ(makeQuestion(t.letter, qIndex + 1));
    setStatus("ask");
    setWrongCount(0);
    setWrongLetters([]);
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setQ(makeQuestion());
    setStatus("ask");
    setWrongCount(0);
    setWrongLetters([]);
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        hero={
          <img
            src="/sonny/carshow-finish.webp"
            alt="Car-show race champion"
            className="pop h-64 w-auto object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.28)] sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  const pct = ((qIndex + (status === "correct" ? 1 : 0)) / ROUND_LEN) * 100;

  return (
    <div className="flex flex-1 flex-col gap-4 px-3 pb-6 sm:gap-8 sm:px-8">
      {/* race track showing progress to the finish line */}
      <div className="relative mx-auto h-24 w-full max-w-3xl sm:h-32" aria-hidden>
        <img
          src="/sonny/carshow-cheer.webp"
          alt=""
          className="pointer-events-none absolute bottom-4 left-0 z-10 h-20 w-auto object-contain drop-shadow-md sm:h-28"
        />
        <div className="road absolute inset-x-0 bottom-0 h-7 rounded-full sm:h-9" />
        <span className="absolute bottom-1 right-1 text-5xl sm:text-6xl">🏁</span>
        <div
          className="absolute bottom-3 w-24 transition-[left,transform] duration-[1100ms] ease-in-out sm:w-36"
          style={{ left: `${pct}%`, transform: `translateX(-${pct}%)` }}
        >
          <SportsCar
            color={myCar.color}
            style={myCar.style}
            stripe={myCar.stripe}
            driving={status === "correct"}
            className="w-full"
          />
        </div>
      </div>

      {/* the letter to find */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(promptKey(q))}
          className="grid size-16 place-items-center rounded-full bg-white text-3xl shadow-lg ring-4 ring-sky-200 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <div
          key={q.target.letter + qIndex}
          className="pop flex min-w-[9rem] items-center justify-center gap-3 rounded-[2rem] bg-white px-6 py-2 shadow-xl ring-4 ring-rose-200 sm:min-w-[14rem]"
        >
          {q.word ? (
            <span className="flex items-center gap-3">
              <span className="text-[clamp(4rem,16vw,7rem)] leading-none">{q.word.emoji}</span>
              <span className="text-[clamp(2rem,9vw,4rem)] font-extrabold leading-none text-rose-500">
                {q.word.word}
              </span>
            </span>
          ) : (
            <span className="text-[clamp(4.5rem,20vw,9rem)] font-extrabold leading-none text-rose-500">
              {show(q.target.letter)}
            </span>
          )}
          {status === "correct" && !q.word && (
            <span
              className="happy-jump text-[clamp(3rem,12vw,6rem)] leading-none"
              aria-label={q.target.word}
            >
              {q.target.emoji}
            </span>
          )}
        </div>
      </div>

      {/* pick the matching car */}
      <div className="mx-auto grid w-full max-w-4xl flex-1 grid-cols-2 content-center gap-3 sm:gap-6">
        {q.options.map((o) => {
          const isTarget = o.letter === q.target.letter;
          const wrong = wrongLetters.includes(o.letter);
          return (
            <button
              key={o.letter}
              type="button"
              aria-label={`Letter ${letterName(o.letter)}`}
              onClick={() => void pick(o)}
              disabled={wrong || status === "correct"}
              className={cn(
                "flex flex-col items-center rounded-3xl bg-white/90 p-2 shadow-xl ring-4 ring-white transition active:scale-95 sm:p-4",
                wrong && "shake scale-90 opacity-40",
                !wrong && wrongCount >= 2 && isTarget && status === "ask" && "hint ring-amber-300",
                status === "correct" && isTarget && "happy-jump ring-green-400",
                status === "correct" && !isTarget && "opacity-50",
              )}
            >
              <span
                className="text-[clamp(3.5rem,17vw,8rem)] font-extrabold leading-none"
                style={{ color: o.color === "#facc15" ? "#ca8a04" : o.color }}
              >
                {show(o.letter)}
              </span>
              <SportsCar
                color={o.color}
                style={o.style}
                driving={status === "correct" && isTarget}
                className="mt-1 w-full"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
