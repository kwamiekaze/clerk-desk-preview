import { useEffect, useRef, useState } from "react";
import {
  newlyUnlocked,
  pickWeighted,
  shuffle,
  starsForRound,
  unlockedLetterCount,
} from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import { COLORS, LETTERS, type GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { sumMastery } from "@/lib/adaptive";
import { nameCheer } from "@/lib/vocab";
import { voiceGroup } from "@/lib/voice-groups";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

const ROUND_LEN = 6;

type Balloon = { letter: string; color: string };
type Question = { target: string; lower: boolean; balloons: Balloon[] };

function makeQuestion(prev?: string): Question {
  const p = getProgress();
  const unlocked = LETTERS.slice(0, unlockedLetterCount(p.balloons)).map((l) => l.letter);
  const target = pickWeighted(
    unlocked,
    (l) => p.balloons[l] ?? 0,
    Math.random,
    (l) => l === prev,
  );
  const score = sumMastery(p.balloons);
  // 3 big balloons to start, then 4, and little letters once he is doing well.
  const count = score >= 8 ? 4 : 3;
  const lower = score >= 18 && Math.random() < 0.5;
  const others = shuffle(unlocked.filter((l) => l !== target)).slice(0, count - 1);
  const colors = shuffle(COLORS);
  const balloons = shuffle([target, ...others]).map((letter, i) => ({
    letter,
    color: (colors[i % colors.length] ?? COLORS[0]!).hex,
  }));
  return { target, lower, balloons };
}

const promptKey = (q: Question) => `${q.lower ? "findlow" : "find"}_${q.target}`;

export function BalloonPop() {
  return (
    <GameShell title="Balloon Pop" emoji="🎈">
      <Play />
    </GameShell>
  );
}

function Play() {
  const alive = useAlive();
  const firstTry = useRef(0);
  const prev = useRef<string | undefined>(undefined);
  const greeted = useRef(false);
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<Question>(() => makeQuestion());
  const [wrongCount, setWrongCount] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [popped, setPopped] = useState<string | null>(null);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("balloons"));
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(async () => {
      if (!alive.current) return;
      if (!greeted.current) {
        greeted.current = true;
        await say("hello");
      }
      if (alive.current) await say(promptKey(q));
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, done]);

  function next() {
    prev.current = q.target;
    setQIndex(qIndex + 1);
    setQ(makeQuestion(q.target));
    setWrongCount(0);
    setWrong([]);
    setPopped(null);
  }

  async function pop(letter: string) {
    if (popped || wrong.includes(letter)) return;
    if (letter !== q.target) {
      if (wrongCount === 0) recordAnswer("balloons", q.target, false);
      setWrongCount((c) => c + 1);
      setWrong((w) => [...w, letter]);
      sfx.wrong();
      void say("try_again", promptKey(q));
      return;
    }
    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("balloons", q.target, true);
    }
    setPopped(letter);
    sfx.correct();
    await say(sample(CHEER_KEYS), nameCheer());
    await sleep(300);
    if (!alive.current) return;
    if (qIndex + 1 >= ROUND_LEN) {
      const before = getProgress().stars;
      const earned = starsForRound(firstTry.current, ROUND_LEN);
      sfx.cheer();
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    next();
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setQ(makeQuestion());
    setWrongCount(0);
    setWrong([]);
    setPopped(null);
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        hero={
          <img
            src="/sonny/friends.webp"
            alt="Sonny John and his friend"
            className="pop h-56 w-auto object-contain drop-shadow-xl sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  return (
    <div className="flex flex-1 flex-col items-center gap-3 px-3 pb-4 sm:px-8">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(promptKey(q))}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 ring-rose-300 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2
          key={qIndex}
          className="pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-2xl font-extrabold text-rose-950 shadow-xl ring-4 ring-rose-300 sm:text-5xl"
        >
          Pop the {q.lower ? q.target.toLowerCase() : q.target}!
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
              i < qIndex || (i === qIndex && popped)
                ? "bg-white shadow-lg"
                : "bg-white/40 ring-1 ring-white",
            )}
          >
            {i < qIndex || (i === qIndex && popped) ? "⭐" : ""}
          </span>
        ))}
      </div>
      <div
        key={qIndex}
        className="grid w-full max-w-xl flex-1 grid-cols-2 content-center gap-4 sm:gap-8"
      >
        {q.balloons.map((b, i) => {
          const isPopped = popped === b.letter;
          return (
            <button
              key={b.letter}
              type="button"
              aria-label={b.letter}
              disabled={wrong.includes(b.letter) || (!!popped && !isPopped)}
              onClick={() => void pop(b.letter)}
              className={cn(
                "bob relative mx-auto grid aspect-[4/5] w-full max-w-56 place-items-center rounded-[50%_50%_50%_50%/45%_45%_55%_55%] text-7xl font-black text-white shadow-2xl ring-4 ring-white/70 transition-transform active:scale-90 sm:text-9xl",
                wrong.includes(b.letter) && "shake scale-90 opacity-40",
                isPopped && "scale-150 opacity-0 duration-300",
                wrongCount >= 2 && b.letter === q.target && !popped && "hint",
              )}
              style={{ background: b.color, animationDelay: `${i * 0.3}s` }}
            >
              <span className="drop-shadow-md">{q.lower ? b.letter.toLowerCase() : b.letter}</span>
              <span
                aria-hidden
                className="absolute -bottom-7 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-white/80"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
