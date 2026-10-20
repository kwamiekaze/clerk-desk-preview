import { useEffect, useRef, useState } from "react";
import { maxCountNumber, newlyUnlocked, starsForRound } from "@/lib/adaptive";
import { preloadClips, sample, say, sfx, sleep } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import type { CarStyle, GarageCar } from "@/lib/content";
import { makeParking, type ParkingQuestion } from "@/lib/counting";
import { addStars, getProgress, recordAnswer } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { CHEER_KEYS } from "@/lib/voice-lines";
import { FinishScreen } from "./FinishScreen";
import { GameShell } from "./GameShell";
import { SportsCar } from "./SportsCar";
import { useAlive } from "./useAlive";

const ROUND_LEN = 5;
const STYLES: CarStyle[] = ["coupe", "wedge", "roadster", "hyper"];
const styleAt = (i: number) => STYLES[i % STYLES.length] as CarStyle;

function nextQuestion(prev?: number): ParkingQuestion {
  const p = getProgress();
  return makeParking(maxCountNumber(p.parking), p.parking, prev);
}

export function ParkingLot() {
  return (
    <GameShell title="Parking Lot" emoji="🅿️">
      <Parking />
    </GameShell>
  );
}

function Parking() {
  const alive = useAlive();
  const perfect = useRef(0);

  const [qIndex, setQIndex] = useState(0);
  const [q, setQ] = useState<ParkingQuestion>(() => nextQuestion());
  const [parked, setParked] = useState<number[]>([]); // car ids, in the order they parked
  const [won, setWon] = useState(false);
  const [done, setDone] = useState<{ stars: number; newCars: GarageCar[] } | null>(null);

  useEffect(() => {
    preloadClips(voiceGroup("parking"));
  }, []);

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => void say(`park_${q.n}`), 400);
    return () => window.clearTimeout(t);
  }, [q, done]);

  async function park(carId: number) {
    if (won || parked.includes(carId)) return;
    const next = [...parked, carId];
    setParked(next);
    sfx.honk();

    if (next.length < q.n) {
      void say(`n_${next.length}`);
      return;
    }

    // Parked exactly the right number!
    setWon(true);
    recordAnswer("parking", String(q.n), true);
    perfect.current += 1;
    sfx.correct();
    window.setTimeout(() => sfx.engine(), 250);
    await say(`n_${next.length}`, sample(CHEER_KEYS));
    await sleep(600);
    if (!alive.current) return;

    if (qIndex + 1 >= ROUND_LEN) {
      const before = getProgress().stars;
      const earned = starsForRound(perfect.current, ROUND_LEN);
      addStars(earned);
      setDone({ stars: earned, newCars: newlyUnlocked(before, before + earned) });
      return;
    }
    setQIndex(qIndex + 1);
    setQ(nextQuestion(q.n));
    setParked([]);
    setWon(false);
  }

  function restart() {
    perfect.current = 0;
    setDone(null);
    setQIndex(0);
    setQ(nextQuestion());
    setParked([]);
    setWon(false);
  }

  if (done) return <FinishScreen stars={done.stars} newCars={done.newCars} onAgain={restart} />;

  const waiting = Array.from({ length: q.bays }, (_, i) => i).filter((i) => !parked.includes(i));

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-3 pb-6 sm:gap-6 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Say it again"
          onClick={() => void say(`park_${q.n}`)}
          className="grid size-16 place-items-center rounded-full bg-white text-3xl shadow-lg ring-4 ring-sky-200 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🔊
        </button>
        <h2 className="rounded-3xl bg-white px-5 py-3 text-3xl font-extrabold text-sky-900 shadow-xl ring-4 ring-sky-200 sm:text-5xl">
          Park <span className="text-emerald-600">{q.n}</span> {q.n === 1 ? "car" : "cars"}!
        </h2>
      </div>

      {/* the parking bays */}
      <div
        key={qIndex}
        className="pop grid w-full max-w-4xl grid-cols-4 gap-2 rounded-[2rem] bg-slate-600/90 p-3 shadow-inner ring-8 ring-slate-500/60 sm:grid-cols-6 sm:gap-4 sm:p-6"
      >
        {Array.from({ length: q.bays }).map((_, i) => {
          const carId = parked[i];
          const has = carId !== undefined;
          return (
            <div
              key={i}
              className={cn(
                "relative flex aspect-[4/3] items-end justify-center rounded-xl border-4 border-dashed border-white/50 pb-1",
                has && "border-solid border-white/20",
              )}
            >
              {has ? (
                <>
                  <span className="pop absolute -top-3 z-10 grid size-9 place-items-center rounded-full bg-white text-xl font-extrabold text-sky-700 shadow-lg sm:size-11 sm:text-2xl">
                    {i + 1}
                  </span>
                  <SportsCar
                    color={q.color.hex}
                    style={styleAt(carId)}
                    driving={won}
                    className="pop w-[90%]"
                  />
                </>
              ) : (
                <span className="text-3xl font-extrabold text-white/30 sm:text-4xl">P</span>
              )}
            </div>
          );
        })}
      </div>

      {/* cars waiting to park: tap one */}
      <div className="mt-auto flex min-h-24 w-full max-w-4xl flex-wrap items-end justify-center gap-2 sm:gap-4">
        {waiting.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={`${q.color.name} car`}
            disabled={won}
            onClick={() => void park(id)}
            className="w-[30%] transition active:scale-90 sm:w-[18%]"
          >
            <SportsCar color={q.color.hex} style={styleAt(id)} className="bob w-full" />
          </button>
        ))}
      </div>
      <p className="text-lg font-bold text-sky-900/80 sm:text-2xl">Tap a car to park it!</p>
    </div>
  );
}
