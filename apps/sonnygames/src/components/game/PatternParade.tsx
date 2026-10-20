import { useEffect, useRef, useState } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import { COLORS, type GarageCar } from "@/lib/content";
import { makePattern, PATTERN_TIER_NAMES, patternTier, type PatternQuestion } from "@/lib/patterns";
import { addStars, getProgress, recordAnswer, useProgress } from "@/lib/progress";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { BubblesScene } from "./Scenes";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;
const hex = (name: string) => COLORS.find((c) => c.name === name)?.hex ?? "#999";

/** A shiny round gem in a colour. */
function Gem({ color, className, glow }: { color: string; className?: string; glow?: boolean }) {
  return (
    <span
      className={cn("relative block aspect-square rounded-full", className)}
      style={{
        background: `radial-gradient(circle at 32% 28%, #fff 0 8%, ${hex(color)} 38%, ${hex(color)} 70%, rgba(0,0,0,0.35) 130%)`,
        boxShadow: glow
          ? `0 0 0 4px #fff, 0 0 24px 8px ${hex(color)}`
          : "0 6px 0 rgba(0,0,0,0.2), 0 0 0 3px rgba(255,255,255,0.85)",
      }}
    />
  );
}

export function PatternParade() {
  return (
    <GameShell title="Pattern Parade" emoji="🎨" bg="candy" decor={<BubblesScene />}>
      <Play />
    </GameShell>
  );
}

function Play() {
  const alive = useAlive();
  const progress = useProgress();
  const firstTry = useRef(0);
  const lastUnit = useRef<string | undefined>(undefined);
  const greeted = useRef(false);

  const makeQ = (): PatternQuestion => {
    const q = makePattern(patternTier(getProgress().patterns), lastUnit.current);
    lastUnit.current = q.unit;
    return q;
  };
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<PatternQuestion>(() => makeQ());
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [wrongCount, setWrongCount] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [reading, setReading] = useState(-1);
  const [cheer, setCheer] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);
  const tier = patternTier(progress.patterns);

  useEffect(() => {
    preloadClips(voiceGroup("patterns"));
  }, []);

  // Read the pattern out loud, lighting up each gem, then ask what comes next.
  useEffect(() => {
    if (done) return;
    let stop = false;
    const t = window.setTimeout(async () => {
      if (!greeted.current) {
        greeted.current = true;
        await say("pt_hello");
      }
      for (let i = 0; i < q.seq.length; i++) {
        if (stop || !alive.current) return;
        setReading(i);
        await say(`col_${q.seq[i]}`);
      }
      if (stop || !alive.current) return;
      setReading(-1);
      await say("pt_q");
    }, 450);
    return () => {
      stop = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, done]);

  async function answer(color: string) {
    if (status !== "ask" || wrong.includes(color)) return;
    if (color !== q.answer) {
      if (wrongCount === 0) recordAnswer("patterns", q.unit, false);
      setWrongCount((c) => c + 1);
      setWrong((w) => [...w, color]);
      sfx.wrong();
      void say("try_again", "pt_q");
      return;
    }
    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("patterns", q.unit, true);
    }
    setStatus("correct");
    sfx.correct();
    setCheer(true);
    await say(`col_${q.answer}`, "pt_yes");
    await sleep(400);
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
    setWrong([]);
  }

  function restart() {
    firstTry.current = 0;
    lastUnit.current = undefined;
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
            src="/photos/sonny_shades1.webp"
            alt="Sonny John"
            className="pop kid-cheer h-56 drop-shadow-xl sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  const correct = status === "correct";
  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-3 pb-3 sm:gap-4 sm:px-8">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(...q.seq.map((c) => `col_${c}`), "pt_q")}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 ring-fuchsia-300 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2
          key={qIndex}
          className="pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-3xl font-extrabold text-fuchsia-950 shadow-xl ring-4 ring-fuchsia-300 sm:text-6xl"
        >
          What comes next?
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
            {i < qIndex || (i === qIndex && correct) ? "🎨" : ""}
          </span>
        ))}
        <span className="ml-2 hidden text-sm font-bold text-fuchsia-950/70 sm:block">
          {PATTERN_TIER_NAMES[tier]}
        </span>
      </div>

      <div
        key={qIndex}
        className="pop flex w-full max-w-4xl flex-1 items-center justify-center rounded-[2rem] bg-white/40 p-3 shadow-inner ring-2 ring-white/70 sm:p-6"
      >
        <div className="flex w-full flex-nowrap items-center justify-center gap-1.5 sm:gap-4">
          {q.seq.map((c, i) => (
            <Gem
              key={i}
              color={c}
              glow={reading === i}
              className={cn(
                "min-w-0 flex-1 max-w-[5.5rem] transition-transform sm:max-w-[7rem]",
                reading === i && "scale-125",
              )}
            />
          ))}
          <span
            className={cn(
              "grid aspect-square place-items-center rounded-full border-4 border-dashed border-fuchsia-500 bg-white/70 text-3xl font-extrabold text-fuchsia-700 sm:text-5xl",
              "min-w-0 flex-1 max-w-[5.5rem] sm:max-w-[7rem]",
              !correct && "kid-idle",
            )}
          >
            {correct ? <Gem color={q.answer} className="w-full" /> : "?"}
          </span>
        </div>
      </div>

      <div className="flex w-full max-w-4xl items-end gap-2 sm:gap-6">
        <img
          key={cheer ? "win" : "idle"}
          src={cheer ? "/photos/sonny_shades2.webp" : "/photos/sonny_shades1.webp"}
          alt="Sonny John"
          draggable={false}
          className={cn("w-24 shrink-0 drop-shadow-xl sm:w-40", cheer ? "kid-cheer" : "kid-idle")}
        />
        <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-5">
          {q.options.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              disabled={wrong.includes(c)}
              onClick={() => void answer(c)}
              className={cn(
                "rounded-full transition active:scale-90",
                wrong.includes(c) && "shake scale-90 opacity-40",
                correct && c === q.answer && "happy-jump",
                wrongCount >= 2 && c === q.answer && !correct && "hint",
              )}
            >
              <Gem color={c} className="w-full" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

