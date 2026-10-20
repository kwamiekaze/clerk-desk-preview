import { useEffect, useRef, useState } from "react";
import { newlyUnlocked, shuffle, starsForRound, sumMastery } from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import type { GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { VWORDS, nameCheer, type VWord } from "@/lib/vocab";
import { voiceGroup } from "@/lib/voice-groups";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;
/** Easy, clear pictures first. */
const POOL = VWORDS.slice(0, 32);

const pick = (n: number, not: VWord[] = []) =>
  shuffle(POOL.filter((w) => !not.includes(w))).slice(0, n);

function Header({
  title,
  ring,
  text,
  onSay,
  qIndex,
  done,
  sub,
}: {
  title: string;
  ring: string;
  text: string;
  onSay: () => void;
  qIndex: number;
  done: boolean;
  sub: string;
}) {
  return (
    <>
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={onSay}
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 active:scale-95 sm:size-20 sm:text-4xl",
            ring,
          )}
        >
          🔊
        </button>
        <h2
          key={title}
          className={cn(
            "pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-2xl font-extrabold shadow-xl ring-4 sm:text-5xl",
            ring,
            text,
          )}
        >
          {title}
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
              i < qIndex || (i === qIndex && done)
                ? "bg-white shadow-lg"
                : "bg-white/40 ring-1 ring-white",
            )}
          >
            {i < qIndex || (i === qIndex && done) ? "⭐" : ""}
          </span>
        ))}
        <span className={cn("ml-2 text-sm font-bold sm:text-lg", text)}>{sub}</span>
      </div>
    </>
  );
}

function Finish({
  stars,
  newCars,
  onAgain,
}: {
  stars: number;
  newCars: GarageCar[];
  onAgain: () => void;
}) {
  return (
    <FinishScreen
      stars={stars}
      newCars={newCars}
      hero={
        <img
          src="/sonny/police.webp"
          alt="Sonny John the police officer"
          className="pop h-56 w-auto object-contain drop-shadow-xl sm:h-80"
        />
      }
      onAgain={onAgain}
    />
  );
}

// ---------- Copy Me: remember the order ----------

export function CopyMe() {
  return (
    <GameShell title="Copy Me" emoji="🧠" bg="candy">
      <CopyPlay />
    </GameShell>
  );
}

/** Starts at 2 pictures in a row and grows as he copies longer ones. */
export function sequenceStart(m: Record<string, number>): number {
  return Math.min(6, 2 + Math.floor(sumMastery(m) / 4));
}

function CopyPlay() {
  const alive = useAlive();
  const run = useRef(0);
  const firstTry = useRef(0);
  const [qIndex, setQIndex] = useState(0);
  const [start] = useState(() => sequenceStart(getProgress().sequence));
  const [items, setItems] = useState<VWord[]>(() =>
    pick(sequenceStart(getProgress().sequence) >= 4 ? 6 : 4),
  );
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<"watch" | "turn" | "win">("watch");
  const [pos, setPos] = useState(0);
  const failed = useRef(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    preloadClips(voiceGroup("sequence"));
  }, []);

  const len = Math.min(10, start + qIndex);

  async function play(s: number[], first: boolean) {
    const id = ++run.current;
    setPhase("watch");
    setPos(0);
    if (first) await say("mo_watch");
    await sleep(400);
    for (const i of s) {
      if (!alive.current || run.current !== id) return;
      setLit(i);
      sfx.tap();
      await sleep(700);
      setLit(null);
      await sleep(260);
    }
    if (!alive.current || run.current !== id) return;
    setPhase("turn");
    if (first) void say("mo_turn");
  }

  // Start each round with a fresh order.
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const s: number[] = [];
      for (let i = 0; i < len; i++) {
        let n = Math.floor(Math.random() * items.length);
        if (n === s[i - 1]) n = (n + 1) % items.length;
        s.push(n);
      }
      failed.current = false;
      setSeq(s);
      void play(s, true);
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, round, done]);

  async function tap(i: number) {
    if (phase !== "turn") return;
    setLit(i);
    window.setTimeout(() => setLit(null), 250);
    if (i !== seq[pos]) {
      failed.current = true;
      sfx.wrong();
      await sleep(500);
      if (alive.current) void play(seq, false);
      return;
    }
    sfx.tap();
    if (pos + 1 < seq.length) {
      setPos(pos + 1);
      return;
    }
    setPhase("win");
    recordAnswer("sequence", `len${seq.length}`, !failed.current);
    if (!failed.current) firstTry.current += 1;
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
    setQIndex(qIndex + 1);
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setRound((r) => r + 1);
    setItems(pick(sequenceStart(getProgress().sequence) >= 4 ? 6 : 4));
  }

  if (done) return <Finish {...done} onAgain={restart} />;

  const cols = items.length > 4 ? 3 : 2;
  return (
    <div className="flex flex-1 flex-col items-center gap-3 px-3 pb-4 sm:px-8">
      <Header
        title={
          phase === "watch" ? "Watch carefully!" : phase === "turn" ? "Your turn!" : "Great memory!"
        }
        ring="ring-pink-300"
        text="text-pink-950"
        onSay={() => void say(phase === "turn" ? "mo_turn" : "mo_watch")}
        qIndex={qIndex}
        done={phase === "win"}
        sub={`${len} in a row`}
      />
      <div
        className="grid w-full max-w-xl flex-1 content-center gap-3 sm:gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {items.map((w, i) => (
          <button
            key={w.id}
            type="button"
            aria-label={w.id}
            disabled={phase !== "turn"}
            onClick={() => void tap(i)}
            className={cn(
              "grid aspect-square place-items-center rounded-[1.75rem] bg-white text-7xl shadow-xl ring-4 ring-white transition active:scale-90 sm:text-9xl",
              lit === i && "scale-110 bg-amber-200 ring-amber-400",
            )}
          >
            <span aria-hidden>{w.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- What's missing? ----------

export function WhatsMissing() {
  return (
    <GameShell title="What's Missing?" emoji="🕵️" bg="dusk">
      <MissingPlay />
    </GameShell>
  );
}

/** 3 pictures at first, growing to 7, with less time to look as he improves. */
export function missingLevel(m: Record<string, number>): { n: number; lookMs: number } {
  const s = sumMastery(m);
  const step = Math.min(4, Math.floor(s / 6));
  return { n: 3 + step, lookMs: 5000 - step * 500 };
}

type MQ = { shown: VWord[]; missing: VWord; options: VWord[]; lookMs: number };

function makeMissing(): MQ {
  const { n, lookMs } = missingLevel(getProgress().missing);
  const shown = pick(n);
  const missing = shown[Math.floor(Math.random() * shown.length)] as VWord;
  const decoys = pick(n >= 5 ? 3 : 2, shown);
  return { shown, missing, options: shuffle([missing, ...decoys]), lookMs };
}

function MissingPlay() {
  const alive = useAlive();
  const firstTry = useRef(0);
  const greeted = useRef(false);
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<MQ>(() => makeMissing());
  const [phase, setPhase] = useState<"look" | "ask" | "win">("look");
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("missing"));
  }, []);

  useEffect(() => {
    if (done) return;
    setPhase("look");
    const t = window.setTimeout(async () => {
      if (!alive.current) return;
      if (!greeted.current) {
        greeted.current = true;
        await say("hello");
      }
      void say("mo_watch");
    }, 400);
    const t2 = window.setTimeout(() => {
      if (!alive.current) return;
      setPhase("ask");
      void say("mx_q");
    }, q.lookMs + 900);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, done]);

  async function answer(w: VWord) {
    if (phase !== "ask" || wrong.includes(w.id)) return;
    if (w.id !== q.missing.id) {
      if (wrong.length === 0) recordAnswer("missing", q.missing.id, false);
      setWrong((x) => [...x, w.id]);
      sfx.wrong();
      void say("try_again", "mx_q");
      return;
    }
    if (wrong.length === 0) {
      firstTry.current += 1;
      recordAnswer("missing", q.missing.id, true);
    }
    setPhase("win");
    sfx.correct();
    await say(`vy_${q.missing.id}`, nameCheer());
    await sleep(400);
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
    setWrong([]);
    setQ(makeMissing());
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setWrong([]);
    setQ(makeMissing());
  }

  if (done) return <Finish {...done} onAgain={restart} />;

  const cols = q.shown.length > 4 ? 3 : 2;
  return (
    <div className="flex flex-1 flex-col items-center gap-3 px-3 pb-4 sm:px-8">
      <Header
        title={phase === "look" ? "Remember them!" : "What's missing?"}
        ring="ring-amber-300"
        text="text-amber-950"
        onSay={() => void say(phase === "look" ? "mo_watch" : "mx_q")}
        qIndex={qIndex}
        done={phase === "win"}
        sub={`${q.shown.length} pictures`}
      />
      {phase === "look" && (
        <div className="h-3 w-full max-w-xl overflow-hidden rounded-full bg-white/50">
          <div
            key={qIndex}
            className="h-full rounded-full bg-white"
            style={{ animation: `shrink ${q.lookMs + 900}ms linear forwards` }}
          />
        </div>
      )}
      <div
        key={`${qIndex}${phase === "look"}`}
        className="pop grid w-full max-w-xl gap-2 rounded-[2rem] bg-white/40 p-3 ring-2 ring-white/70 sm:gap-4 sm:p-5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {q.shown.map((w) =>
          phase !== "look" && w.id === q.missing.id ? (
            <span
              key={w.id}
              aria-hidden
              className="grid aspect-[5/3] place-items-center rounded-2xl border-4 border-dashed border-amber-400 bg-white/70 text-5xl font-black text-amber-500 sm:text-7xl"
            >
              {phase === "win" ? w.emoji : "?"}
            </span>
          ) : (
            <span
              key={w.id}
              aria-hidden
              className="grid aspect-[5/3] place-items-center rounded-2xl bg-white text-5xl shadow sm:text-7xl"
            >
              {w.emoji}
            </span>
          ),
        )}
      </div>
      {phase !== "look" && (
        <div
          className="grid w-full max-w-xl flex-1 content-center gap-3 sm:gap-6"
          style={{ gridTemplateColumns: `repeat(${q.options.length > 3 ? 2 : 3}, minmax(0, 1fr))` }}
        >
          {q.options.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-label={w.id}
              disabled={wrong.includes(w.id)}
              onClick={() => void answer(w)}
              className={cn(
                "mx-auto grid aspect-square w-full max-h-44 place-items-center rounded-[1.75rem] bg-white text-6xl shadow-xl ring-4 ring-white transition active:scale-90 sm:text-8xl",
                wrong.includes(w.id) && "shake scale-90 opacity-40",
                phase === "win" && w.id === q.missing.id && "happy-jump ring-amber-300",
              )}
            >
              <span aria-hidden>{w.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
