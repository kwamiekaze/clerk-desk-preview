import { useEffect, useRef, useState } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import { type GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { makeSea, type SeaQuestion } from "@/lib/sea";
import { nameCheer } from "@/lib/vocab";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { Clouds, GameShell } from "./GameShell";
import { PromptCard } from "./PromptCard";
import { useAlive } from "./useAlive";

const ROUND_LEN = 6;

export function BoatGame() {
  return (
    <GameShell title="Boat Captain" emoji="⛵" decor={<Clouds />}>
      <Play />
    </GameShell>
  );
}

/** A little sailboat. `cargo` crates ride on the deck. */
function Boat({
  color = "#ef4444",
  cargo = 0,
  className,
}: {
  color?: string;
  cargo?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 150" className={className} role="img" aria-label="Boat">
      <path d="M100 8 L100 92 L158 92 Z" fill="#fff" stroke="#cbd5e1" strokeWidth="3" />
      <path d="M96 22 L96 92 L52 92 Z" fill="#fde68a" stroke="#f59e0b" strokeWidth="3" />
      <rect x="97" y="6" width="5" height="90" rx="2" fill="#78350f" />
      <path d="M102 6 L128 14 L102 22 Z" fill="#ef4444" />
      {Array.from({ length: cargo }, (_, i) => (
        <rect
          key={i}
          x={46 + (i % 4) * 27}
          y={i < 4 ? 74 : 56}
          width="24"
          height="22"
          rx="3"
          fill="#b45309"
          stroke="#78350f"
          strokeWidth="3"
        />
      ))}
      <path
        d="M20 96 L180 96 L156 134 L46 134 Z"
        fill={color}
        stroke="#0f172a"
        strokeOpacity="0.35"
        strokeWidth="4"
      />
      <rect x="30" y="102" width="140" height="8" fill="#fff" opacity="0.7" />
      <circle cx="70" cy="119" r="6" fill="#fff" opacity="0.85" />
      <circle cx="100" cy="119" r="6" fill="#fff" opacity="0.85" />
      <circle cx="130" cy="119" r="6" fill="#fff" opacity="0.85" />
    </svg>
  );
}

function Sea() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%]" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-blue-700" />
      <div className="absolute inset-x-0 -top-4 flex justify-around text-4xl opacity-90">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="bob" style={{ animationDelay: `${i * 0.3}s` }}>
            🌊
          </span>
        ))}
      </div>
    </div>
  );
}

function promptKeys(q: SeaQuestion): string[] {
  if (q.kind === "find") return [q.word.ask];
  if (q.kind === "load") return [`bl_${q.n}`];
  return [`bc_${q.color.name}`];
}

function Play() {
  const alive = useAlive();
  const firstTry = useRef(0);
  const prevKey = useRef<string | undefined>(undefined);
  const greeted = useRef(false);
  const makeQ = () => {
    const q = makeSea(getProgress().boat, prevKey.current);
    prevKey.current = q.key;
    return q;
  };
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<SeaQuestion>(makeQ);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sailing, setSailing] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("boat"));
  }, []);
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const first = greeted.current ? [] : ["bt_start"];
      greeted.current = true;
      void say(...first, ...promptKeys(q));
    }, 450);
    return () => window.clearTimeout(t);
  }, [q, done]);

  async function win(yes: string[]) {
    const clean = wrong.length === 0;
    recordAnswer("boat", q.key, clean);
    if (clean) firstTry.current += 1;
    setBusy(true);
    sfx.correct();
    sfx.honk();
    setSailing(true);
    await say(...yes, nameCheer());
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
    setQIndex((i) => i + 1);
    setQ(makeQ());
    setWrong([]);
    setLoaded(0);
    setSailing(false);
    setArriving(true);
    setBusy(false);
    window.setTimeout(() => setArriving(false), 1000);
  }

  function pickAnswer(id: string, correct: boolean, yes: string[]) {
    if (busy || wrong.includes(id)) return;
    sfx.unlock();
    if (!correct) {
      setWrong((w) => [...w, id]);
      setShake(id);
      sfx.wrong();
      void say("try_again", ...promptKeys(q));
      return;
    }
    void win(yes);
  }

  function loadCrate(i: number) {
    if (q.kind !== "load" || busy || taken.has(i)) return;
    sfx.unlock();
    sfx.clunk();
    taken.add(i);
    const n = loaded + 1;
    setLoaded(n);
    if (n >= q.n) {
      void (async () => {
        setBusy(true);
        await say(`n_${n}`);
        if (!alive.current) return;
        await win(["bt_loaded"]);
      })();
    } else void say(`n_${n}`);
  }
  const [taken] = useState(() => new Set<number>());
  useEffect(() => {
    taken.clear();
  }, [q, taken]);

  if (done) {
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        headline="Great sailing, Sonny John!"
        hero={
          <div className="bob w-56" aria-hidden>
            <Boat color="#0ea5e9" cargo={4} />
          </div>
        }
        onAgain={() => window.location.reload()}
      />
    );
  }

  const replay = () => {
    sfx.tap();
    void say(...promptKeys(q));
  };

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col gap-3 p-3 sm:max-w-xl">
      <Sea />
      <PromptCard index={qIndex} total={ROUND_LEN} onReplay={replay}>
        {q.kind === "find" && (
          <>
            Find the <span className="text-rose-500">{q.word.id}</span>!
          </>
        )}
        {q.kind === "color" && (
          <>
            Find the <span style={{ color: q.color.hex }}>{q.color.name}</span> boat!
          </>
        )}
        {q.kind === "load" && (
          <>
            Load <span className="text-3xl text-rose-500">{q.n}</span>{" "}
            {q.n === 1 ? "crate" : "crates"} onto the boat!
          </>
        )}
      </PromptCard>

      <div className="relative z-10 flex flex-1 flex-col justify-center">
        {q.kind === "find" && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {q.options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                disabled={wrong.includes(o.id)}
                aria-label={o.id}
                onClick={() => pickAnswer(o.id, o.id === q.word.id, [q.word.yes])}
                onAnimationEnd={() => setShake(null)}
                className={cn(
                  "bob grid size-[9rem] place-items-center rounded-full bg-white/90 text-[5.5rem] shadow-xl ring-8 ring-sky-200 transition active:scale-90 disabled:opacity-30",
                  shake === o.id && "shake",
                )}
                style={{ animationDelay: `${i * 0.35}s` }}
              >
                {o.emoji}
              </button>
            ))}
          </div>
        )}
        {q.kind === "color" && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {q.options.map((o, i) => (
              <button
                key={o.name}
                type="button"
                disabled={wrong.includes(o.name)}
                aria-label={`${o.name} boat`}
                onClick={() => pickAnswer(o.name, o.name === q.color.name, [])}
                onAnimationEnd={() => setShake(null)}
                className={cn(
                  "bob grid h-[8rem] w-[9.5rem] place-items-center rounded-3xl bg-white/90 shadow-xl ring-8 ring-sky-200 transition active:scale-90 disabled:opacity-30",
                  shake === o.name && "shake",
                )}
                style={{ animationDelay: `${i * 0.35}s` }}
              >
                <Boat color={o.hex} className="w-32" />
              </button>
            ))}
          </div>
        )}
        {q.kind === "load" && (
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl bg-amber-100/90 p-3 shadow-xl ring-4 ring-amber-300">
            <p className="w-full text-center text-base font-extrabold text-amber-800">
              ⚓ Dock · tap a crate to load it
            </p>
            {Array.from({ length: q.crates }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label="Crate"
                onClick={() => loadCrate(i)}
                className={cn(
                  "grid size-[4.5rem] place-items-center rounded-xl border-4 border-amber-900/50 bg-amber-600 text-4xl shadow-md transition active:scale-90",
                  taken.has(i) && "pointer-events-none opacity-0",
                )}
              >
                📦
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto mt-auto w-52 pb-6",
          sailing && "sail-away",
          arriving && "sail-in",
          !sailing && !arriving && "bob",
        )}
      >
        <Boat
          color={q.kind === "color" ? "#94a3b8" : "#ef4444"}
          cargo={q.kind === "load" ? loaded : 0}
        />
      </div>
    </div>
  );
}
