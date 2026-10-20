import { useEffect, useRef, useState } from "react";
import { newlyUnlocked, starsForRound, type Mastery } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import type { GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer, useProgress, type Bucket } from "@/lib/progress";
import { nameCheer, type Option, type PickQuestion } from "@/lib/vocab";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;

export type PickConfig = {
  title: string;
  emoji: string;
  bg: string;
  /** Tailwind colour pieces for the question card. */
  ring: string;
  text: string;
  bucket: Bucket;
  /** Mastery key lives in the bucket. */
  make: (m: Mastery, prev?: string) => PickQuestion;
  tierName: (m: Mastery) => string;
  clips: () => string[];
  hello: string[];
  mascot: { idle: string; cheer: string };
  hero: string;
  heroAlt: string;
};

/** A cup that is full or empty, drawn so it never looks like anything else. */
function Cup({ level }: { level: "full" | "empty" }) {
  return (
    <svg viewBox="0 0 100 120" className="h-full w-full" aria-hidden>
      <path
        d="M18 10h64l-8 100H26z"
        fill="#fff"
        stroke="#0369a1"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {level === "full" && <path d="M22 24h56l-6 82H28z" fill="#38bdf8" />}
      {level === "full" && <path d="M22 24h56" stroke="#e0f2fe" strokeWidth="5" />}
    </svg>
  );
}

function Pic({ o, className }: { o: Option; className?: string }) {
  return (
    <span className={cn("grid place-items-center leading-none", className)} aria-hidden>
      {o.svg ? <Cup level={o.svg} /> : o.emoji}
    </span>
  );
}

export function PickGame({ cfg }: { cfg: PickConfig }) {
  return (
    <GameShell title={cfg.title} emoji={cfg.emoji} bg={cfg.bg}>
      <Play cfg={cfg} />
    </GameShell>
  );
}

function Play({ cfg }: { cfg: PickConfig }) {
  const alive = useAlive();
  const progress = useProgress();
  const firstTry = useRef(0);
  const lastKey = useRef<string | undefined>(undefined);
  const greeted = useRef(false);

  const makeQ = (): PickQuestion => {
    const q = cfg.make(getProgress()[cfg.bucket], lastKey.current);
    lastKey.current = q.key;
    return q;
  };
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<PickQuestion>(() => makeQ());
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [wrongCount, setWrongCount] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [cheer, setCheer] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(cfg.clips());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(async () => {
      if (!alive.current) return;
      if (!greeted.current) {
        greeted.current = true;
        await say(...cfg.hello);
      }
      if (alive.current) await say(...q.ask);
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, done]);

  async function answer(id: string) {
    if (status !== "ask" || wrong.includes(id)) return;
    if (id !== q.answer) {
      if (wrongCount === 0) recordAnswer(cfg.bucket, q.key, false);
      setWrongCount((c) => c + 1);
      setWrong((w) => [...w, id]);
      sfx.wrong();
      void say("try_again", ...q.ask);
      return;
    }
    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer(cfg.bucket, q.key, true);
    }
    setStatus("correct");
    sfx.correct();
    setCheer(true);
    await say(...q.yes, nameCheer());
    await sleep(350);
    if (!alive.current) return;
    setCheer(false);
    await sleep(250);
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
    setWrong([]);
  }

  function restart() {
    firstTry.current = 0;
    lastKey.current = undefined;
    setDone(null);
    setQIndex(0);
    setQ(makeQ());
    setStatus("ask");
    setWrongCount(0);
    setWrong([]);
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        hero={
          <img
            src={cfg.hero}
            alt={cfg.heroAlt}
            className="pop h-56 w-auto object-contain drop-shadow-xl sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  const correct = status === "correct";
  const many = q.options.length >= 4;
  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-3 pb-3 sm:gap-4 sm:px-8">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(...q.ask)}
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 active:scale-95 sm:size-20 sm:text-4xl",
            cfg.ring,
          )}
        >
          🔊
        </button>
        <h2
          key={qIndex}
          className={cn(
            "pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-2xl font-extrabold shadow-xl ring-4 sm:text-5xl",
            cfg.ring,
            cfg.text,
          )}
        >
          {q.title}
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
        <span className={cn("ml-2 hidden text-sm font-bold sm:block", cfg.text)}>
          {cfg.tierName(progress[cfg.bucket])}
        </span>
      </div>

      {q.target && (
        <div
          key={`t${qIndex}`}
          className="pop grid h-24 w-24 place-items-center rounded-3xl bg-white/90 text-6xl shadow-xl ring-4 ring-white sm:h-32 sm:w-32 sm:text-7xl"
        >
          <Pic o={q.target} />
        </div>
      )}

      <div
        key={qIndex}
        className="pop flex w-full max-w-4xl flex-1 items-center justify-center rounded-[2rem] bg-white/40 p-3 shadow-inner ring-2 ring-white/70 sm:p-6"
      >
        <div
          className={cn(
            "grid w-full gap-3 sm:gap-6",
            many ? "grid-cols-2" : q.options.length === 3 ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          {q.options.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-label={o.id}
              disabled={wrong.includes(o.id)}
              onClick={() => void answer(o.id)}
              className={cn(
                "grid aspect-square place-items-center rounded-[1.75rem] bg-white shadow-xl ring-4 ring-white transition active:scale-90",
                many ? "max-h-44 sm:max-h-40" : "max-h-60 sm:max-h-52",
                "mx-auto w-full",
                wrong.includes(o.id) && "shake scale-90 opacity-40",
                correct && o.id === q.answer && "happy-jump ring-amber-300",
                wrongCount >= 2 && o.id === q.answer && !correct && "hint",
              )}
            >
              <span className="grid h-full w-full place-items-center">
                <Pic
                  o={o}
                  className={cn(
                    o.label ? "h-1/2 w-3/5" : "h-3/5 w-3/5",
                    many
                      ? "text-6xl sm:text-8xl"
                      : q.options.length === 3
                        ? "text-5xl sm:text-8xl"
                        : "text-8xl sm:text-9xl",
                    o.label && "text-5xl sm:text-7xl",
                  )}
                />
                {o.label && (
                  <span className="-mt-6 px-1 text-center text-lg font-extrabold leading-tight text-slate-800 sm:-mt-10 sm:text-3xl">
                    {o.label}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-4xl items-end justify-center">
        <img
          key={cheer ? "win" : "idle"}
          src={cheer ? cfg.mascot.cheer : cfg.mascot.idle}
          alt="Sonny John"
          draggable={false}
          className={cn(
            "h-36 w-auto object-contain drop-shadow-xl sm:h-40",
            cheer ? "kid-cheer" : "kid-idle",
          )}
        />
      </div>
    </div>
  );
}
