import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import type { GarageCar } from "@/lib/content";
import { say, sfx } from "@/lib/audio";
import { Confetti } from "./Confetti";
import { SportsCar } from "./SportsCar";

type Props = {
  stars: number;
  newCars: GarageCar[];
  headline?: string;
  /** Replaces the trophy (e.g. Sonny's own photo). */
  hero?: ReactNode;
  /** Light text for dark backgrounds. */
  dark?: boolean;
  onAgain: () => void;
};

export function FinishScreen({
  stars,
  newCars,
  headline = "You did it, Sonny John!",
  hero,
  dark = false,
  onAgain,
}: Props) {
  useEffect(() => {
    sfx.cheer();
    const lines = [stars >= 2 ? "fin_2" : "fin_1"];
    const first = newCars[0];
    if (first) lines.push("new_car", `car_${first.id}`);
    const t = window.setTimeout(() => void say(...lines), 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-4 text-center">
      <Confetti />
      {hero ?? (
        <div className="bob text-8xl sm:text-9xl" aria-hidden>
          🏆
        </div>
      )}
      <h2
        className={`pop text-4xl font-extrabold sm:text-6xl ${dark ? "text-white drop-shadow-lg" : "text-sky-900"}`}
      >
        {headline}
      </h2>
      <div className="flex gap-2 text-6xl sm:text-7xl" aria-label={`${stars} stars earned`}>
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} className="pop" style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
            ⭐
          </span>
        ))}
      </div>

      {newCars.map((c) => (
        <div key={c.id} className="pop rounded-3xl bg-white/90 p-4 shadow-xl ring-4 ring-amber-300">
          <p className="text-xl font-bold text-amber-600 sm:text-2xl">New car unlocked!</p>
          <SportsCar
            color={c.color}
            style={c.style}
            stripe={c.stripe}
            className="mx-auto w-64 sm:w-80"
            label={c.name}
          />
          <p className="text-2xl font-extrabold text-sky-900">{c.name}</p>
        </div>
      ))}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            sfx.engine();
            onAgain();
          }}
          className="rounded-full bg-green-500 px-10 py-5 text-3xl font-extrabold text-white shadow-xl ring-4 ring-green-200 active:scale-95 sm:text-4xl"
        >
          🔁 Again!
        </button>
        <Link
          to="/"
          className="rounded-full bg-white px-8 py-5 text-3xl font-extrabold text-sky-700 shadow-xl ring-4 ring-sky-200 active:scale-95 sm:text-4xl"
        >
          🏠
        </Link>
      </div>
    </div>
  );
}
