import { useEffect, useState } from "react";
import { preloadClips, say, sfx } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import { GARAGE } from "@/lib/content";
import { selectCar, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { GameShell } from "./GameShell";
import { SportsCar } from "./SportsCar";

export function MyGarage() {
  return (
    <GameShell title="My Cars" emoji="🏎️">
      <Garage />
    </GameShell>
  );
}

function Garage() {
  const { stars, selectedCar } = useProgress();
  const [bounceId, setBounceId] = useState<string | null>(null);

  const next = GARAGE.find((c) => c.cost > stars);
  const prevCost = [...GARAGE].reverse().find((c) => c.cost <= stars)?.cost ?? 0;
  const pct = next ? Math.round(((stars - prevCost) / (next.cost - prevCost)) * 100) : 100;

  useEffect(() => {
    preloadClips(voiceGroup("garage"));
  }, []);

  function tap(id: string) {
    const car = GARAGE.find((c) => c.id === id);
    if (!car) return;
    setBounceId(id);
    window.setTimeout(() => setBounceId(null), 700);
    if (car.cost > stars) {
      sfx.wrong();
      const more = car.cost - stars;
      void say(...(more <= 10 ? [`n_${more}`] : []), more === 1 ? "more_star" : "more_stars");
      return;
    }
    selectCar(id);
    sfx.engine();
    void say(`car_${car.id}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-3 pb-8 sm:px-8">
      {next ? (
        <div className="w-full max-w-xl rounded-3xl bg-white/90 p-3 text-center shadow-lg ring-4 ring-amber-200">
          <p className="text-lg font-bold text-sky-900 sm:text-2xl">
            ⭐ {next.cost - stars} more {next.cost - stars === 1 ? "star" : "stars"} for a new car!
          </p>
          <div className="mt-2 h-5 overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-amber-400 transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-full bg-white px-6 py-3 text-2xl font-extrabold text-amber-600 shadow-lg">
          🏆 You have every car!
        </p>
      )}

      <div className="grid w-full max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {GARAGE.map((c) => {
          const locked = c.cost > stars;
          const selected = c.id === selectedCar;
          return (
            <button
              key={c.id}
              type="button"
              aria-label={locked ? `${c.name}, locked` : c.name}
              onClick={() => tap(c.id)}
              className={cn(
                "relative flex flex-col items-center rounded-3xl bg-white/90 p-3 shadow-xl ring-4 transition active:scale-95",
                selected ? "ring-green-400" : "ring-white",
                bounceId === c.id && (locked ? "shake" : "happy-jump"),
              )}
            >
              {selected && (
                <span className="absolute -top-3 right-2 rounded-full bg-green-500 px-3 py-0.5 text-sm font-extrabold text-white shadow">
                  Driving
                </span>
              )}
              <SportsCar
                color={c.color}
                style={c.style}
                stripe={c.stripe}
                locked={locked}
                driving={bounceId === c.id && !locked}
                className="w-full"
                label={c.name}
              />
              <span className="mt-1 text-lg font-extrabold text-sky-900 sm:text-xl">
                {locked ? "???" : c.name}
              </span>
              {locked && (
                <span className="text-base font-bold text-amber-500 sm:text-lg">⭐ {c.cost}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
