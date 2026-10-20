import { useEffect, useRef, useState } from "react";
import { newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, say, sfx, sleep } from "@/lib/audio";
import { type GarageCar } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { makeSky, type Dir, type Ring, type Shape, type SkyQuestion, SKY_WORDS } from "@/lib/sky";
import { nameCheer } from "@/lib/vocab";
import { voiceGroup } from "@/lib/voice-groups";
import { cn } from "@/lib/utils";
import { FinishScreen } from "./FinishScreen";
import { Clouds, GameShell } from "./GameShell";
import { PromptCard } from "./PromptCard";
import { useAlive } from "./useAlive";

const ROUND_LEN = 6;

export function PlaneGame() {
  return (
    <GameShell title="Sky Pilot" emoji="✈️" decor={<Clouds />}>
      <Play />
    </GameShell>
  );
}

/** A little plane facing right. */
function Plane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 110" className={className} role="img" aria-label="Plane">
      <path d="M20 40 L6 8 L40 8 L60 40 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="3" />
      <ellipse cx="112" cy="58" rx="92" ry="26" fill="#fff" stroke="#94a3b8" strokeWidth="4" />
      <path d="M96 62 L70 104 L120 104 L150 62 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="3" />
      <path d="M96 50 L72 6 L112 6 L146 50 Z" fill="#60a5fa" stroke="#1e3a8a" strokeWidth="3" />
      {[84, 112, 140].map((x) => (
        <circle key={x} cx={x} cy="56" r="8" fill="#bae6fd" stroke="#0369a1" strokeWidth="3" />
      ))}
      <path
        d="M170 44 Q196 46 200 62 Q190 70 170 70 Z"
        fill="#bae6fd"
        stroke="#0369a1"
        strokeWidth="3"
      />
      <rect x="198" y="40" width="6" height="40" rx="3" fill="#475569" />
    </svg>
  );
}

const SHAPE_COLOR: Record<Shape, string> = {
  circle: "#f43f5e",
  square: "#3b82f6",
  triangle: "#22c55e",
  heart: "#ec4899",
  star: "#f59e0b",
  diamond: "#8b5cf6",
};

function ShapeIcon({ shape, className }: { shape: Shape; className?: string }) {
  const fill = SHAPE_COLOR[shape];
  const common = { fill, stroke: "#0f172a", strokeOpacity: 0.25, strokeWidth: 4 };
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {shape === "circle" && <circle cx="50" cy="50" r="40" {...common} />}
      {shape === "square" && <rect x="12" y="12" width="76" height="76" rx="6" {...common} />}
      {shape === "triangle" && (
        <path d="M50 10 L92 86 L8 86 Z" {...common} strokeLinejoin="round" />
      )}
      {shape === "diamond" && (
        <path d="M50 6 L90 50 L50 94 L10 50 Z" {...common} strokeLinejoin="round" />
      )}
      {shape === "heart" && (
        <path
          d="M50 88 C10 58 6 30 28 20 C40 15 48 22 50 30 C52 22 60 15 72 20 C94 30 90 58 50 88 Z"
          {...common}
        />
      )}
      {shape === "star" && (
        <path
          d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z"
          {...common}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function RingFace({ ring }: { ring: Ring }) {
  if (ring.kind === "word") {
    const w = SKY_WORDS.find((x) => x.id === ring.value);
    return <span className="text-[4.5rem] leading-none">{w?.emoji}</span>;
  }
  if (ring.kind === "shape") return <ShapeIcon shape={ring.value as Shape} className="size-20" />;
  if (ring.kind === "number") {
    const n = Number(ring.value);
    return (
      <span className="flex flex-col items-center leading-none">
        <span className="text-6xl font-extrabold text-sky-900">{n}</span>
        <span className="mt-1 flex max-w-[5.5rem] flex-wrap justify-center gap-0.5">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="size-2 rounded-full bg-amber-500" />
          ))}
        </span>
      </span>
    );
  }
  return <span className="text-7xl font-extrabold leading-none text-rose-500">{ring.value}</span>;
}

function promptKeys(q: SkyQuestion): string[] {
  if (q.kind === "dir") return [`ap_d_${q.dir}`];
  const v = q.answer.value;
  if (q.what === "word") return [`ap_q_${v}`];
  if (q.what === "shape") return [`ap_s_${v}`];
  if (q.what === "number") return ["ap_num", `n_${v}`];
  return [`find_${v}`];
}
function yesKeys(q: SkyQuestion): string[] {
  if (q.kind === "dir") return [`ap_dy_${q.dir}`];
  const v = q.answer.value;
  if (q.what === "word") return [`ap_y_${v}`];
  if (q.what === "shape") return [`ap_ys_${v}`];
  if (q.what === "number") return [`n_${v}`];
  return [`letter_${v}`];
}

const ARROW: Record<Dir, string> = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };
const FLY: Record<Dir, string> = {
  up: "translate(0,-30vh)",
  down: "translate(0,18vh)",
  left: "translate(-35vw,0)",
  right: "translate(35vw,0)",
};

function Play() {
  const alive = useAlive();
  const firstTry = useRef(0);
  const prevKey = useRef<string | undefined>(undefined);
  const greeted = useRef(false);
  const makeQ = () => {
    const q = makeSky(getProgress().plane, prevKey.current);
    prevKey.current = q.key;
    return q;
  };
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<SkyQuestion>(makeQ);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [away, setAway] = useState(false);
  const [moved, setMoved] = useState<Dir | null>(null);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("plane"));
  }, []);
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => {
      const first = greeted.current ? [] : ["ap_start"];
      greeted.current = true;
      void say(...first, ...promptKeys(q));
    }, 450);
    return () => window.clearTimeout(t);
  }, [q, done]);

  async function win() {
    const clean = wrong.length === 0;
    recordAnswer("plane", q.key, clean);
    if (clean) firstTry.current += 1;
    setBusy(true);
    sfx.correct();
    if (q.kind === "dir") {
      setMoved(q.dir);
      sfx.engine();
    } else {
      setAway(true);
      sfx.whistle();
    }
    await say(...yesKeys(q), nameCheer());
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
    setQIndex((i) => i + 1);
    setQ(makeQ());
    setWrong([]);
    setAway(false);
    setMoved(null);
    setBusy(false);
  }

  function choose(id: string, correct: boolean) {
    if (busy || wrong.includes(id)) return;
    sfx.unlock();
    if (!correct) {
      setWrong((w) => [...w, id]);
      setShake(id);
      sfx.wrong();
      void say("try_again", ...promptKeys(q));
      return;
    }
    void win();
  }

  if (done) {
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        headline="Great flying, Sonny John!"
        hero={<Plane className="bob w-64" />}
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
      <PromptCard index={qIndex} total={ROUND_LEN} onReplay={replay}>
        {q.kind === "dir" && (
          <>
            Fly <span className="text-3xl text-rose-500">{q.dir}</span>! {ARROW[q.dir]}
          </>
        )}
        {q.kind === "ring" && q.what === "word" && (
          <>
            Fly through the <span className="text-rose-500">{q.answer.value}</span>!
          </>
        )}
        {q.kind === "ring" && q.what === "shape" && (
          <>
            Fly through the <span className="text-rose-500">{q.answer.value}</span>!
          </>
        )}
        {q.kind === "ring" && q.what === "number" && (
          <>
            Fly through the number <span className="text-3xl text-rose-500">{q.answer.value}</span>!
          </>
        )}
        {q.kind === "ring" && q.what === "letter" && (
          <>
            Find the letter <span className="text-3xl text-rose-500">{q.answer.value}</span>!
          </>
        )}
      </PromptCard>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
        {q.kind === "ring" && (
          <div className="flex max-w-[20rem] flex-wrap items-center justify-center gap-5">
            {q.rings.map((r, i) => (
              <button
                key={r.id}
                type="button"
                disabled={wrong.includes(r.id)}
                aria-label={`${r.kind} ${r.value}`}
                onClick={() => choose(r.id, r.id === q.answer.id)}
                onAnimationEnd={() => setShake(null)}
                className={cn(
                  "bob grid size-[9rem] place-items-center rounded-full border-[12px] border-amber-400 bg-white/85 shadow-xl ring-4 ring-amber-200 transition active:scale-90 disabled:opacity-30",
                  shake === r.id && "shake",
                )}
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                <RingFace ring={r} />
              </button>
            ))}
          </div>
        )}
        {q.kind === "dir" && (
          <div className="grid w-64 grid-cols-3 grid-rows-3 place-items-center gap-2">
            {(["up", "left", "right", "down"] as Dir[]).map((d) => {
              const pos =
                d === "up"
                  ? "col-start-2 row-start-1"
                  : d === "down"
                    ? "col-start-2 row-start-3"
                    : d === "left"
                      ? "col-start-1 row-start-2"
                      : "col-start-3 row-start-2";
              return q.options.includes(d) ? (
                <button
                  key={d}
                  type="button"
                  aria-label={d}
                  disabled={wrong.includes(d)}
                  onClick={() => choose(d, d === q.dir)}
                  onAnimationEnd={() => setShake(null)}
                  className={cn(
                    pos,
                    "grid size-[5.5rem] place-items-center rounded-3xl bg-amber-400 text-5xl shadow-xl ring-4 ring-white transition active:scale-90 disabled:opacity-30",
                    shake === d && "shake",
                  )}
                >
                  {ARROW[d]}
                </button>
              ) : null;
            })}
            <div
              className="col-start-2 row-start-2 w-28 transition-transform duration-1000"
              style={{ transform: moved ? FLY[moved] : undefined }}
            >
              <Plane className="w-full" />
            </div>
          </div>
        )}
      </div>

      {q.kind === "ring" && (
        <div className="relative z-10 mx-auto mt-auto w-40 pb-8">
          <Plane className={cn(away ? "fly-away" : "bob")} />
        </div>
      )}
    </div>
  );
}
