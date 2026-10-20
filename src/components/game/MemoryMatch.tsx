import { useEffect, useRef, useState } from "react";
import { newlyUnlocked, shuffle } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import type { GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer, useProgress, type Bucket } from "@/lib/progress";
import {
  ALBUM_COUNT,
  RHYME_EMOJI,
  albumSrc,
  makeMemory,
  makeRhymeMatch,
  matchLevel,
  nameCheer,
} from "@/lib/vocab";
import { shuffle as shuf } from "@/lib/adaptive";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

type Mode = "words" | "photo" | "rhyme";
type Face = { emoji?: string; img?: string };
type Card = { uid: number; pid: string; face: Face; matched: boolean };

const MODES: Record<
  Mode,
  {
    title: string;
    emoji: string;
    heading: string;
    bucket: Bucket;
    hello: string;
    group: "memory" | "photomatch" | "rhymematch";
    ring: string;
    text: string;
    maxPairs: number;
  }
> = {
  words: {
    title: "Memory Match",
    emoji: "🃏",
    heading: "Find the pairs!",
    bucket: "memory",
    hello: "mm_q",
    group: "memory",
    ring: "ring-fuchsia-300",
    text: "text-fuchsia-950",
    maxPairs: 12,
  },
  photo: {
    title: "Photo Match",
    emoji: "📸",
    heading: "Match the photos!",
    bucket: "photomatch",
    hello: "mm_q",
    group: "photomatch",
    ring: "ring-sky-300",
    text: "text-sky-950",
    maxPairs: 10,
  },
  rhyme: {
    title: "Rhyme Match",
    emoji: "🎵",
    heading: "Find the rhymes!",
    bucket: "rhymematch",
    hello: "rm_q",
    group: "rhymematch",
    ring: "ring-violet-300",
    text: "text-violet-950",
    maxPairs: 8,
  },
};

function deal(mode: Mode): Card[] {
  const p = getProgress();
  let items: { pid: string; faces: [Face, Face] }[];
  if (mode === "words") {
    items = makeMemory(p.memory).map((w) => ({
      pid: w.id,
      faces: [{ emoji: w.emoji }, { emoji: w.emoji }],
    }));
  } else if (mode === "photo") {
    const idx = shuf(Array.from({ length: ALBUM_COUNT }, (_, i) => i)).slice(
      0,
      matchLevel(p.photomatch, 10).pairs,
    );
    items = idx.map((i) => ({ pid: `a${i}`, faces: [{ img: albumSrc(i) }, { img: albumSrc(i) }] }));
  } else {
    items = makeRhymeMatch(p.rhymematch).map((r) => ({
      pid: r.a,
      faces: [{ emoji: RHYME_EMOJI[r.a] ?? "❓" }, { emoji: RHYME_EMOJI[r.b] ?? "❓" }],
    }));
  }
  return shuf(
    items.flatMap((it, i) =>
      [0, 1].map((k) => ({
        uid: i * 2 + k,
        pid: it.pid,
        face: it.faces[k] as Face,
        matched: false,
      })),
    ),
  );
}

const yesKeys = (mode: Mode, pid: string) =>
  mode === "words" ? [`vy_${pid}`] : mode === "rhyme" ? [`ry_${pid}`] : ["mm_yes"];

export function MemoryMatch() {
  return <MatchGame mode="words" />;
}
export function PhotoMatch() {
  return <MatchGame mode="photo" />;
}
export function RhymeMatch() {
  return <MatchGame mode="rhyme" />;
}

function MatchGame({ mode }: { mode: Mode }) {
  const cfg = MODES[mode];
  return (
    <GameShell title={cfg.title} emoji={cfg.emoji} bg="candy">
      <Play mode={mode} />
    </GameShell>
  );
}

function Play({ mode }: { mode: Mode }) {
  const cfg = MODES[mode];
  const alive = useAlive();
  const progress = useProgress();
  const [cards, setCards] = useState<Card[]>(() => deal(mode));
  const [up, setUp] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);
  const greeted = useRef(false);
  const pairs = cards.length / 2;
  const [peekMs, setPeekMs] = useState(
    () => matchLevel(getProgress()[cfg.bucket], cfg.maxPairs).peekMs,
  );
  const [peeking, setPeeking] = useState(peekMs > 0);
  /** Cards he has already looked at in an earlier turn: using them is real remembering. */
  const seen = useRef<Set<number>>(new Set());
  const lvl = matchLevel(progress[cfg.bucket], cfg.maxPairs);

  useEffect(() => {
    preloadClips(voiceGroup(cfg.group));
    const t = window.setTimeout(() => {
      if (!greeted.current && alive.current) {
        greeted.current = true;
        void say(peekMs > 0 ? "mm_peek" : cfg.hello);
      }
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The peek: all the cards are face up for a few seconds, then they turn over.
  useEffect(() => {
    if (!peeking) return;
    const t = window.setTimeout(() => {
      seen.current = new Set(cards.map((c) => c.uid));
      setPeeking(false);
    }, peekMs + 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peeking, peekMs]);

  async function flip(uid: number) {
    if (peeking || busy || up.includes(uid) || cards.find((c) => c.uid === uid)?.matched) return;
    sfx.tap();
    const next = [...up, uid];
    setUp(next);
    if (next.length < 2) return;
    setBusy(true);
    const a = cards.find((c) => c.uid === next[0]) as Card;
    const b = cards.find((c) => c.uid === next[1]) as Card;
    await sleep(750);
    if (!alive.current) return;
    const knewA = seen.current.has(a.uid);
    const knewB = seen.current.has(b.uid);
    if (a.pid === b.pid) {
      sfx.correct();
      const after = cards.map((c) => (c.pid === a.pid ? { ...c, matched: true } : c));
      setCards(after);
      setUp([]);
      // Only count it when both cards were remembered, not found by luck.
      if (knewA && knewB) recordAnswer(cfg.bucket, a.pid, true);
      await say(...yesKeys(mode, a.pid), nameCheer());
      if (after.every((c) => c.matched)) {
        await sleep(300);
        if (!alive.current) return;
        const before = getProgress().stars;
        const earned = misses <= pairs ? 2 : 1;
        sfx.cheer();
        addStars(earned);
        setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
        return;
      }
    } else {
      sfx.wrong();
      setMisses((m) => m + 1);
      setUp([]);
      // Flipping a card whose partner he had already seen means he forgot where it was.
      for (const [c, d] of [
        [a, b],
        [b, a],
      ] as const) {
        const partnerSeen = cards.some(
          (x) => x.pid === c.pid && x.uid !== c.uid && seen.current.has(x.uid),
        );
        if (partnerSeen && c.pid !== d.pid) recordAnswer(cfg.bucket, c.pid, false);
      }
      seen.current.add(a.uid);
      seen.current.add(b.uid);
    }
    setBusy(false);
  }

  function restart() {
    const ms = matchLevel(getProgress()[cfg.bucket], cfg.maxPairs).peekMs;
    seen.current = new Set();
    setPeekMs(ms);
    setPeeking(ms > 0);
    if (ms > 0) void say("mm_peek");
    setCards(deal(mode));
    setUp([]);
    setMisses(0);
    setBusy(false);
    setDone(null);
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        hero={
          <img
            src="/sonny/police.webp"
            alt="Sonny John the police officer"
            className="pop h-56 w-auto object-contain drop-shadow-xl sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  const cols = cards.length <= 4 ? 2 : cards.length <= 6 ? 3 : 4;
  const tall = cards.length <= 16;
  return (
    <div className="flex flex-1 flex-col items-center gap-3 px-3 pb-4 sm:px-8">
      <div className="flex w-full max-w-3xl items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(cfg.hello)}
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full bg-white/95 text-2xl shadow-lg ring-4 active:scale-95 sm:size-20 sm:text-4xl",
            cfg.ring,
          )}
        >
          🔊
        </button>
        <h2
          className={cn(
            "pop flex-1 rounded-3xl bg-white/95 px-4 py-2 text-center text-2xl font-extrabold shadow-xl ring-4 sm:text-5xl",
            cfg.ring,
            cfg.text,
          )}
        >
          {peeking ? "Remember them!" : cfg.heading}
        </h2>
      </div>
      <p className={cn("text-sm font-bold opacity-70 sm:text-lg", cfg.text)}>
        Level {lvl.level} · {lvl.pairs} pairs
      </p>
      {peeking && (
        <div className="h-3 w-full max-w-xl overflow-hidden rounded-full bg-white/50">
          <div
            key={peekMs}
            className="h-full rounded-full bg-white"
            style={{ animation: `shrink ${peekMs + 600}ms linear forwards` }}
          />
        </div>
      )}
      <div
        className={cn(
          "grid w-full flex-1 content-center gap-2 sm:gap-4",
          cols === 2 ? "max-w-[17rem] sm:max-w-sm" : "max-w-xl",
        )}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((c) => {
          const shown = peeking || c.matched || up.includes(c.uid);
          return (
            <button
              key={c.uid}
              type="button"
              aria-label={shown ? c.pid : "card"}
              onClick={() => void flip(c.uid)}
              className={cn(
                "relative grid place-items-center overflow-hidden rounded-3xl shadow-xl ring-4 transition active:scale-95",
                tall ? "aspect-[3/4]" : "aspect-square",
                shown
                  ? "bg-white ring-white"
                  : "bg-gradient-to-b from-sky-400 to-indigo-500 ring-white/80",
                c.matched && "happy-jump opacity-90 ring-amber-300",
              )}
            >
              {shown ? (
                c.face.img ? (
                  <img
                    src={c.face.img}
                    alt=""
                    draggable={false}
                    className="pop h-full w-full object-contain"
                  />
                ) : (
                  <span className="pop text-5xl sm:text-8xl" aria-hidden>
                    {c.face.emoji}
                  </span>
                )
              ) : (
                <img
                  src="/sonny/sonny-green.webp"
                  alt=""
                  draggable={false}
                  className="h-[88%] w-auto object-contain"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
