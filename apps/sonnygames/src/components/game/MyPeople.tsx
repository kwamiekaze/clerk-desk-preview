import { useEffect, useRef, useState } from "react";
import {
  newlyUnlocked,
  pickWeighted,
  shuffle,
  starsForRound,
  unlockedPeopleCount,
} from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import { PEOPLE, type GarageCar, type Person } from "@/lib/content";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;

type Question = { target: Person; options: Person[] };

function makeQuestion(prevId?: string): Question {
  const p = getProgress();
  const pool = PEOPLE.slice(0, unlockedPeopleCount(p.people));
  const target = pickWeighted(
    pool,
    (x) => p.people[x.id] ?? 0,
    Math.random,
    (x) => x.id === prevId,
  );
  const others = shuffle(pool.filter((x) => x.id !== target.id)).slice(0, 2);
  return { target, options: shuffle([target, ...others]) };
}

export function MyPeople() {
  return (
    <GameShell title="My People" emoji="👨‍👩‍👧">
      <People />
    </GameShell>
  );
}

function People() {
  const alive = useAlive();
  const firstTry = useRef(0);
  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<Question>(() => makeQuestion());
  const [status, setStatus] = useState<"ask" | "correct">("ask");
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("people"));
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => void say(`where_${q.target.id}`), 400);
    return () => window.clearTimeout(t);
  }, [q, done]);

  async function pick(person: Person) {
    if (status !== "ask" || wrongIds.includes(person.id)) return;
    const t = q.target;
    if (person.id !== t.id) {
      if (wrongCount === 0) recordAnswer("people", t.id, false);
      setWrongCount((n) => n + 1);
      setWrongIds((w) => [...w, person.id]);
      sfx.wrong();
      void say("try_again", `where_${t.id}`);
      return;
    }
    if (wrongCount === 0) {
      firstTry.current += 1;
      recordAnswer("people", t.id, true);
    }
    setStatus("correct");
    sfx.correct();
    await say(`yes_${t.id}`, sample(CHEER_KEYS));
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
    setQ(makeQuestion(t.id));
    setStatus("ask");
    setWrongCount(0);
    setWrongIds([]);
  }

  function restart() {
    firstTry.current = 0;
    setDone(null);
    setQIndex(0);
    setQ(makeQuestion());
    setStatus("ask");
    setWrongCount(0);
    setWrongIds([]);
  }

  if (done)
    return (
      <FinishScreen
        stars={done.stars}
        newCars={done.newCars}
        headline="Friends learn together!"
        hero={
          <img
            src="/sonny/friends.webp"
            alt="Two soccer friends"
            className="pop h-64 w-auto object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.28)] sm:h-80"
          />
        }
        onAgain={restart}
      />
    );

  return (
    <div className="flex flex-1 flex-col gap-4 px-3 pb-6 sm:gap-8 sm:px-8">
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(`where_${q.target.id}`)}
          className="grid size-16 place-items-center rounded-full bg-white text-3xl shadow-lg ring-4 ring-sky-200 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <div className="rounded-[2rem] bg-white px-6 py-3 text-center shadow-xl ring-4 ring-rose-200">
          <p className="text-2xl font-extrabold text-rose-500 sm:text-4xl">
            Where is {q.target.name}?
          </p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl flex-1 grid-cols-3 content-center gap-2 sm:gap-6">
        {q.options.map((o) => {
          const wrong = wrongIds.includes(o.id);
          const isTarget = o.id === q.target.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-label={o.name}
              onClick={() => void pick(o)}
              disabled={wrong || status === "correct"}
              className={cn(
                "flex flex-col items-center gap-1 rounded-3xl bg-white/90 p-2 shadow-xl ring-4 ring-white transition active:scale-95 sm:p-4",
                wrong && "shake scale-90 opacity-40",
                !wrong && wrongCount >= 2 && isTarget && status === "ask" && "hint ring-amber-300",
                status === "correct" && isTarget && "happy-jump ring-green-400",
                status === "correct" && !isTarget && "opacity-50",
              )}
            >
              <span
                className="grid size-[clamp(4.5rem,20vw,8rem)] place-items-center rounded-full text-[clamp(2.5rem,12vw,5rem)]"
                style={{ backgroundColor: o.color + "33" }}
              >
                {o.emoji}
              </span>
              <span
                className="text-[clamp(1.1rem,5vw,2.2rem)] font-extrabold leading-tight"
                style={{ color: o.color === "#facc15" ? "#ca8a04" : o.color }}
              >
                {o.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
