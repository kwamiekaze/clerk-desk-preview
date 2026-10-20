import { useEffect, useRef, useState } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import type { GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { FIND_NAMES, fatBox, hitBox, makeFind, nameCheer, type FindQuestion } from "@/lib/vocab";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;

export function FindIt() {
  return (
    <GameShell title="Find It on Sonny" emoji="🔍" bg="dusk">
      <Play />
    </GameShell>
  );
}

function Play() {
  const alive = useAlive();
  const firstTry = useRef(0);
  const lastKey = useRef<string | undefined>(undefined);
  const greeted = useRef(false);
  const makeQ = (): FindQuestion => {
    const q = makeFind(getProgress().findit, lastKey.current);
    lastKey.current = `${q.scene.id}_${q.word}`;
    return q;
  };
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<FindQuestion>(() => makeQ());
  const [wrongCount, setWrongCount] = useState(0);
  const [found, setFound] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);
  const key = `${q.scene.id}_${q.word}`;

  useEffect(() => {
    preloadClips(voiceGroup("findit"));
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(async () => {
      if (!alive.current) return;
      if (!greeted.current) {
        greeted.current = true;
        await say("f_hello");
      }
      if (alive.current) await say(`vp_${q.word}`);
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, done]);

  async function tap(e: React.PointerEvent<HTMLDivElement>) {
    if (found) return;
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    if (!hitBox(q.scene, q.word, fx, fy)) {
      if (wrongCount === 0) recordAnswer("findit", key, false);
      setWrongCount((c) => c + 1);
      sfx.wrong();
      void say("try_again", `vp_${q.word}`);
      return;
    }
    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("findit", key, true);
    }
    setFound(true);
    sfx.correct();
    await say(`vy_${q.word}`, nameCheer());
    await sleep(500);
    if (!alive.current) return;
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
    setFound(false);
    setWrongCount(0);
  }

  function restart() {
    firstTry.current = 0;
    lastKey.current = undefined;
    setDone(null);
    setQIndex(0);
    setQ(makeQ());
    setFound(false);
    setWrongCount(0);
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

  const boxes = (q.scene.targets[q.word] ?? []).map((b) => fatBox(q.scene, b));
  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-3 pb-3 sm:gap-4 sm:px-8">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(`vp_${q.word}`)}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 ring-amber-300 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2
          key={qIndex}
          className="pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-2xl font-extrabold text-amber-950 shadow-xl ring-4 ring-amber-300 sm:text-5xl"
        >
          {FIND_NAMES[q.word] ? `Find ${FIND_NAMES[q.word]}!` : `Find the ${q.word}!`}
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
              i < qIndex || (i === qIndex && found)
                ? "bg-white shadow-lg"
                : "bg-white/40 ring-1 ring-white",
            )}
          >
            {i < qIndex || (i === qIndex && found) ? "⭐" : ""}
          </span>
        ))}
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          key={qIndex}
          role="img"
          aria-label={`Sonny John. Tap ${FIND_NAMES[q.word] ?? `the ${q.word}`}.`}
          onPointerDown={(e) => void tap(e)}
          className="pop relative max-h-[62dvh] touch-manipulation overflow-hidden rounded-3xl shadow-2xl ring-4 ring-white"
          style={{ aspectRatio: `${q.scene.w} / ${q.scene.h}`, height: "62dvh", maxWidth: "100%" }}
        >
          <img
            src={q.scene.src}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full select-none object-fill"
          />
          {(found || wrongCount >= 2) &&
            boxes.map(([x1, y1, x2, y2], i) => (
              <span
                key={i}
                className={cn(
                  "pointer-events-none absolute rounded-2xl border-4",
                  found ? "border-green-400 bg-green-300/30" : "hint border-amber-300",
                )}
                style={{
                  left: `${(x1 / q.scene.w) * 100}%`,
                  top: `${(y1 / q.scene.h) * 100}%`,
                  width: `${((x2 - x1) / q.scene.w) * 100}%`,
                  height: `${((y2 - y1) / q.scene.h) * 100}%`,
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
