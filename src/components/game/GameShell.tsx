import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { preloadClips, sfx, stopSpeaking } from "@/lib/audio";
import { voiceGroup } from "@/lib/voice-groups";
import { setMuted, useProgress } from "@/lib/progress";
import { NightScene } from "./NightScene";

const CLOUDS = [
  { top: "8%", size: "4rem", dur: 60, delay: -10 },
  { top: "20%", size: "3rem", dur: 85, delay: -40 },
  { top: "5%", size: "5rem", dur: 110, delay: -70 },
];

export function Clouds() {
  return (
    <>
      {CLOUDS.map((c, i) => (
        <span
          key={i}
          className="cloud"
          style={{
            top: c.top,
            fontSize: c.size,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
          aria-hidden
        >
          ☁️
        </span>
      ))}
    </>
  );
}

export function StarChip() {
  const { stars } = useProgress();
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-2xl font-bold text-amber-500 shadow-lg ring-4 ring-amber-200 sm:text-3xl">
      <span aria-hidden>⭐</span>
      <span aria-label={`${stars} stars`}>{stars}</span>
    </div>
  );
}

function MuteButton() {
  const { muted } = useProgress();
  return (
    <button
      type="button"
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      onClick={() => {
        if (!muted) stopSpeaking();
        setMuted(!muted);
        if (muted) sfx.tap();
      }}
      className="grid size-12 place-items-center rounded-full bg-white text-2xl shadow-lg ring-4 ring-sky-200 active:scale-95 sm:size-14"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

/**
 * Common frame for every game: sky, big Home button, stars, sound toggle.
 * Games only mount after a tap so that the browser allows voice and sound.
 */
export function GameShell({
  title,
  emoji,
  night = false,
  bg,
  decor,
  children,
}: {
  title: string;
  emoji: string;
  /** Spooky night sky instead of the sunny one (Ghost Game). */
  night?: boolean;
  /** Other backdrop class (pitch, track, train, candy) used instead of the sunny sky. */
  bg?: string;
  /** Backdrop decoration used instead of drifting clouds. */
  decor?: ReactNode;
  children: ReactNode;
}) {
  const [ready, setReady] = useState<boolean | null>(null);

  useEffect(() => {
    const active = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
      .userActivation?.hasBeenActive;
    setReady(!!active);
    preloadClips(voiceGroup("common"));
    return () => stopSpeaking();
  }, []);

  return (
    <div
      className={`${night ? "night" : (bg ?? "sky")} relative flex min-h-[100dvh] flex-col overflow-hidden`}
    >
      {night ? <NightScene /> : (decor ?? <Clouds />)}
      <header className="relative z-10 flex items-center justify-between gap-2 p-3 sm:p-5">
        <Link
          to="/"
          aria-label="Home"
          onClick={() => {
            sfx.tap();
            stopSpeaking();
          }}
          className="grid size-16 place-items-center rounded-full bg-white text-3xl shadow-lg ring-4 ring-sky-300 active:scale-95 sm:size-20 sm:text-4xl"
        >
          🏠
        </Link>
        <h1
          className={`min-w-0 flex-1 text-center text-lg font-bold leading-tight drop-shadow-sm sm:text-4xl ${night ? "text-white" : "text-sky-900"}`}
        >
          <span aria-hidden>{emoji} </span>
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <StarChip />
          <MuteButton />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {ready === null ? null : ready ? (
          children
        ) : (
          <div className="grid flex-1 place-items-center p-6">
            <button
              type="button"
              onClick={() => {
                sfx.unlock();
                sfx.engine();
                setReady(true);
              }}
              className="pop flex size-56 flex-col items-center justify-center rounded-full bg-green-500 text-7xl font-extrabold text-white shadow-2xl ring-8 ring-green-200 active:scale-95 sm:size-72"
            >
              <span aria-hidden className="text-6xl sm:text-7xl">
                🏎️
              </span>
              GO!
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
