import { useEffect, useMemo, useRef, useState } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import type { GarageCar } from "@/lib/content";
import {
  ghostKey,
  ghostOptions,
  ghostTier,
  makeGhost,
  TIER_NAMES,
  type GhostQuestion,
} from "@/lib/ghosts";
import { addStars, getProgress, recordAnswer, useProgress } from "@/lib/progress";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { Ghost, type GhostTint } from "./Ghost";
import { SonnyGhost } from "./SonnyGhost";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;
const numKey = (n: number) => `n_${n}`;
const PROMPT: Record<GhostQuestion["kind"], string> = {
  count: "g_q",
  add: "g_add",
  sub: "g_sub",
  more: "g_more",
};

type G = { id: number; group: 0 | 1; tint: GhostTint; variant: number; leaving: boolean };

const TINT_A: GhostTint[] = ["white", "lilac", "peach", "mint"];

/** The ghosts on screen for a question. Ids are stable so tapped ghosts keep their numbers. */
function buildGhosts(q: GhostQuestion): G[] {
  const pick = (i: number, off: number) => (i * 7 + off) % 4;
  const mk = (count: number, group: 0 | 1, start: number, tint?: GhostTint): G[] =>
    Array.from({ length: count }, (_, i) => ({
      id: start + i,
      group,
      tint: tint ?? (TINT_A[pick(start + i, 1)] as GhostTint),
      variant: pick(start + i, 3),
      leaving: false,
    }));
  switch (q.kind) {
    case "count":
      return mk(q.n, 0, 0);
    case "add":
      return [...mk(q.a, 0, 0, "lilac"), ...mk(q.b, 1, 20, "mint")];
    case "sub": {
      const all = mk(q.total, 0, 0);
      return all.map((g, i) => ({ ...g, leaving: i >= q.total - q.gone }));
    }
    case "more":
      return [...mk(q.left, 0, 0, "lilac"), ...mk(q.right, 1, 20, "peach")];
  }
}

export function GhostGame() {
  return (
    <GameShell title="Ghost Game" emoji="👻" night>
      <Play />
    </GameShell>
  );
}

function Pumpkin({
  n,
  onClick,
  wrong,
  right,
  hint,
}: {
  n: number;
  onClick: () => void;
  wrong: boolean;
  right: boolean;
  hint: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`${n}`}
      onClick={onClick}
      disabled={wrong}
      className={cn(
        "pumpkin relative grid aspect-square w-full place-items-center transition active:scale-90",
        wrong && "shake scale-90 opacity-40",
        right && "happy-jump",
        hint && "hint rounded-full",
      )}
    >
      <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="pk" cx="50%" cy="38%" r="70%">
            <stop offset="0" stopColor="#ffc16b" />
            <stop offset="0.6" stopColor="#fb8a1f" />
            <stop offset="1" stopColor="#d9480f" />
          </radialGradient>
        </defs>
        <rect
          x="45"
          y="2"
          width="10"
          height="16"
          rx="4"
          fill="#3b7d2c"
          transform="rotate(8 50 10)"
        />
        <path d="M54 14c10-6 18-2 20 6-8 2-16 0-20-6Z" fill="#4caf3a" />
        <ellipse cx="50" cy="54" rx="46" ry="36" fill="url(#pk)" />
        <path
          d="M50 20C36 28 36 78 50 88M50 20c14 8 14 58 0 68"
          stroke="#c2410c"
          strokeWidth="2.5"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M24 34C14 46 16 68 28 80M76 34c10 12 8 34-4 46"
          stroke="#c2410c"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <ellipse
          cx="34"
          cy="38"
          rx="9"
          ry="5"
          fill="#fff"
          opacity="0.28"
          transform="rotate(-25 34 38)"
        />
      </svg>
      <span
        className="relative text-[clamp(2.6rem,11vw,4.5rem)] font-extrabold leading-none text-white"
        style={{ textShadow: "0 3px 0 #9a3412, 0 0 14px rgba(120,53,15,0.6)" }}
      >
        {n}
      </span>
    </button>
  );
}

function Play() {
  const alive = useAlive();
  const progress = useProgress();
  const firstTry = useRef(0);
  const lastKey = useRef<string | undefined>(undefined);
  const greeted = useRef(false);

  const makeQ = (): GhostQuestion => {
    const p = getProgress();
    const q = makeGhost(ghostTier(p.ghosts), p.ghosts, lastKey.current);
    lastKey.current = ghostKey(q);
    return q;
  };

  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<GhostQuestion>(() => makeQ());
  const ghosts = useMemo(() => buildGhosts(q), [q]);
  const options = useMemo(() => (q.kind === "more" ? [] : ghostOptions(q.n)), [q]);

  const [counted, setCounted] = useState<number[]>([]);
  const [gone, setGone] = useState(false); // subtraction: the ghosts have flown away
  const [joined, setJoined] = useState(false); // addition: the two groups merged
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [auto, setAuto] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongNums, setWrongNums] = useState<number[]>([]);
  const [wrongSide, setWrongSide] = useState<"left" | "right" | null>(null);
  const [sonny, setSonny] = useState<"idle" | "covered">("idle");
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  const tier = ghostTier(progress.ghosts);
  const stay = (g: G) => !(q.kind === "sub" && g.leaving);
  const countable = ghosts.filter(stay);

  useEffect(() => {
    preloadClips(voiceGroup("ghosts"));
  }, []);

  // Ask the question out loud (the very first time, say hello with a boo).
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const lines = greeted.current ? [PROMPT[q.kind]] : ["g_hello", PROMPT[q.kind]];
      greeted.current = true;
      void say(...lines);
    }, 450);
    return () => window.clearTimeout(t);
  }, [q, done]);

  // Subtraction: after a moment, the ghosts that are leaving fly away.
  useEffect(() => {
    if (q.kind !== "sub") return;
    const t = window.setTimeout(() => {
      setGone(true);
      sfx.whoosh();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [q]);

  function tapGhost(g: G) {
    if (status !== "ask" || auto || q.kind === "more") return;
    if (!stay(g)) return;
    const at = counted.indexOf(g.id);
    if (at >= 0) {
      sfx.ghost(at + 1);
      void say(numKey(at + 1));
      return;
    }
    const next = [...counted, g.id];
    setCounted(next);
    sfx.ghost(next.length);
    void say(numKey(next.length));
  }

  async function autoCount() {
    setAuto(true);
    setCounted([]);
    for (let k = 0; k < countable.length; k++) {
      await sleep(250);
      if (!alive.current) return;
      setCounted(countable.slice(0, k + 1).map((g) => g.id));
      sfx.ghost(k + 1);
      await say(numKey(k + 1));
      if (!alive.current) return;
    }
    await sleep(300);
    if (!alive.current) return;
    setAuto(false);
    void say(PROMPT[q.kind]);
  }

  async function celebrate(lines: string[]) {
    setStatus("correct");
    sfx.correct();
    setCounted(countable.map((g) => g.id));
    if (q.kind === "add") setJoined(true);
    // the blanket drops over Sonny, then he pops back out
    setSonny("covered");
    sfx.whoosh();
    await say(...lines);
    await sleep(500);
    if (!alive.current) return;
    setSonny("idle");
    await sleep(650);
  }

  async function finishRound() {
    const before = getProgress().stars;
    const earned = starsForRound(firstTry.current, ROUND_LEN);
    // Boo! Peekaboo! Sonny John pops out of the blanket before the stars.
    setSonny("covered");
    sfx.whoosh();
    await sleep(500);
    if (!alive.current) return;
    sfx.boo();
    await say("g_boo");
    setSonny("idle");
    await say("g_peek");
    if (!alive.current) return;
    addStars(earned);
    setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
  }

  async function advance() {
    if (qIndex + 1 >= ROUND_LEN) return finishRound();
    setQIndex(qIndex + 1);
    setQ(makeQ());
    setCounted([]);
    setGone(false);
    setJoined(false);
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
    setWrongSide(null);
  }

  function scored(correct: boolean) {
    if (wrongCount === 0) {
      if (correct) firstTry.current += 1;
      recordAnswer("ghosts", ghostKey(q), correct);
    }
  }

  async function answer(num: number) {
    if (status !== "ask" || auto || wrongNums.includes(num) || q.kind === "more") return;
    if (q.kind === "sub" && !gone) return; // wait for the ghosts to fly away
    if (num !== q.n) {
      scored(false);
      setWrongCount((c) => c + 1);
      setWrongNums((w) => [...w, num]);
      sfx.wrong();
      await say(`no_n_${num}`, "lets_count");
      if (alive.current) await autoCount();
      return;
    }
    scored(true);
    const noun =
      q.kind === "add"
        ? "g_all"
        : q.kind === "sub"
          ? q.n === 1
            ? "g_left1"
            : "g_left"
          : q.n === 1
            ? "g_1"
            : "g_n";
    await celebrate(["yes", numKey(q.n), noun]);
    if (alive.current) await advance();
  }

  async function pickSide(side: "left" | "right") {
    if (status !== "ask" || q.kind !== "more" || wrongSide === side) return;
    if (side !== q.answer) {
      scored(false);
      setWrongCount((c) => c + 1);
      setWrongSide(side);
      sfx.wrong();
      void say("try_again", "g_more");
      return;
    }
    scored(true);
    await celebrate([sample(CHEER_KEYS), "g_more_yes"]);
    if (alive.current) await advance();
  }

  function restart() {
    firstTry.current = 0;
    lastKey.current = undefined;
    setDone(null);
    setQIndex(0);
    setQ(makeQ());
    setCounted([]);
    setGone(false);
    setJoined(false);
    setStatus("ask");
    setWrongCount(0);
    setWrongNums([]);
    setWrongSide(null);
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        dark
        hero={
          <img
            src="/ghost/sonny-portrait.webp"
            alt="Sonny John"
            className="hero-glow pop h-64 w-auto object-contain drop-shadow-[0_0_22px_rgba(216,180,254,0.9)] sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  const askHeadline = {
    count: "How many ghosts?",
    add: `${q.kind === "add" ? q.a : ""} + ${q.kind === "add" ? q.b : ""} = ?`,
    sub: `${q.kind === "sub" ? q.total : ""} − ${q.kind === "sub" ? q.gone : ""} = ?`,
    more: "Which side has more?",
  }[q.kind];

  const groupGhosts = (group: 0 | 1) => ghosts.filter((g) => g.group === group);

  const renderGhost = (g: G, size: string) => {
    const at = counted.indexOf(g.id);
    const left = q.kind === "sub" && g.leaving && gone;
    const showOutline = q.kind === "sub" && g.leaving && gone;
    return (
      <button
        key={g.id}
        type="button"
        aria-label="ghost"
        onClick={() => tapGhost(g)}
        className={cn("relative transition active:scale-90", size, left && "pointer-events-none")}
        style={{ animationDelay: `${(g.id % 5) * 0.3}s` }}
      >
        <div
          className={cn(!left && "ghost-float", left && "ghost-leave", at >= 0 && "ghost-counted")}
          style={{ animationDelay: left ? "0s" : `${(g.id % 6) * 0.35}s` }}
        >
          <Ghost
            tint={g.tint}
            variant={g.variant}
            id={String(g.id)}
            counted={at >= 0}
            number={at >= 0 ? at + 1 : undefined}
          />
        </div>
        {showOutline && (
          <div className="absolute inset-0 opacity-70">
            <Ghost gone id={`o${g.id}`} />
          </div>
        )}
      </button>
    );
  };

  const sizeFor = (n: number) =>
    n <= 1
      ? "w-[44%] max-w-[13rem] sm:max-w-[16rem]"
      : n <= 3
        ? "w-[27%] max-w-[9.5rem] sm:max-w-[12rem]"
        : n <= 6
          ? "w-[23%] max-w-[8rem] sm:max-w-[10rem]"
          : "w-[18%] max-w-[6.5rem] sm:max-w-[8.5rem]";

  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-3 pb-3 sm:gap-4 sm:px-8">
      {/* prompt + progress */}
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(PROMPT[q.kind])}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 ring-violet-300 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2
          key={qIndex}
          className="pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-3xl font-extrabold tracking-wide text-violet-950 shadow-xl ring-4 ring-violet-300 sm:text-6xl"
        >
          {askHeadline}
        </h2>
      </div>

      <div className="flex items-center gap-3 text-white">
        <img
          src="/ghost/sonny-portrait.webp"
          alt=""
          className="h-12 w-10 object-contain drop-shadow-md sm:h-16 sm:w-14"
        />
        <div className="flex gap-1.5" aria-label={`Question ${qIndex + 1} of ${ROUND_LEN}`}>
          {Array.from({ length: ROUND_LEN }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "grid size-7 place-items-center rounded-full text-sm transition sm:size-9",
                i < qIndex || (i === qIndex && status === "correct")
                  ? "bg-amber-300 text-purple-950 shadow-[0_0_12px_rgba(253,224,71,0.9)]"
                  : "bg-white/20 ring-1 ring-white/40",
              )}
            >
              {i < qIndex || (i === qIndex && status === "correct") ? "👻" : ""}
            </span>
          ))}
        </div>
        <span className="hidden text-sm font-bold opacity-80 sm:block">{TIER_NAMES[tier]}</span>
      </div>

      {/* the haunted playfield */}
      <div
        key={qIndex}
        className="pop relative flex w-full max-w-4xl flex-1 items-center justify-center rounded-[2rem] bg-white/10 p-2 shadow-[inset_0_0_40px_rgba(167,139,250,0.35)] ring-2 ring-white/25 backdrop-blur-[2px] sm:p-6"
      >
        {q.kind === "more" ? (
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-6">
            {(["left", "right"] as const).map((side) => {
              const wrong = wrongSide === side;
              const hint = wrongCount >= 2 && side === q.answer && status === "ask";
              return (
                <button
                  key={side}
                  type="button"
                  aria-label={`${side} side`}
                  onClick={() => void pickSide(side)}
                  className={cn(
                    "flex flex-wrap content-center items-end justify-center gap-1 rounded-[1.75rem] bg-white/15 p-2 ring-4 ring-white/30 transition active:scale-95",
                    wrong && "shake opacity-50",
                    hint && "hint",
                    status === "correct" && side === q.answer && "ring-amber-300",
                  )}
                >
                  {groupGhosts(side === "left" ? 0 : 1).map((g) => (
                    <div key={g.id} className="w-[28%] sm:w-[22%]">
                      <div
                        className="ghost-float"
                        style={{ animationDelay: `${(g.id % 5) * 0.4}s` }}
                      >
                        <Ghost tint={g.tint} variant={g.variant} id={String(g.id)} />
                      </div>
                    </div>
                  ))}
                </button>
              );
            })}
          </div>
        ) : q.kind === "add" ? (
          <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <div className="flex flex-wrap justify-center gap-1">
              {groupGhosts(0).map((g) => renderGhost(g, sizeFor(Math.max(q.a, q.b) + 2)))}
            </div>
            <span className="text-5xl font-extrabold text-amber-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] sm:text-7xl">
              {joined ? "=" : "+"}
            </span>
            <div className={cn("flex flex-wrap justify-center gap-1", joined && "ghost-join")}>
              {groupGhosts(1).map((g) => renderGhost(g, sizeFor(Math.max(q.a, q.b) + 2)))}
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-wrap content-center items-center justify-center gap-x-1 gap-y-3 sm:gap-x-3">
            {ghosts.map((g) => renderGhost(g, sizeFor(q.kind === "sub" ? q.total : q.n)))}
          </div>
        )}
      </div>

      {/* Sonny + the answer pumpkins */}
      <div className="flex w-full max-w-4xl items-end gap-2 sm:gap-6">
        <SonnyGhost mode={sonny} className="w-28 shrink-0 sm:w-44" />
        {q.kind === "more" ? (
          <p className="flex-1 pb-4 text-center text-xl font-extrabold text-white drop-shadow sm:text-3xl">
            Tap the side with more ghosts!
          </p>
        ) : (
          <div className="grid flex-1 grid-cols-3 gap-1 sm:gap-5">
            {options.map((n) => (
              <Pumpkin
                key={n}
                n={n}
                wrong={wrongNums.includes(n)}
                right={status === "correct" && n === q.n}
                hint={wrongCount >= 2 && n === q.n && status === "ask"}
                onClick={() => void answer(n)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
