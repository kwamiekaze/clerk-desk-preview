import { cn } from "@/lib/utils";

/** Soccer pitch backdrop: floodlights, a crowd of colourful fans, mown stripes and a goal. */
export function PitchScene() {
  const fans = ["#ef4444", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="pitch-stripes absolute inset-x-0 bottom-0 top-[22%]" />
      {/* crowd */}
      <div className="absolute inset-x-0 top-[14%] flex justify-around px-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="kid-idle block size-4 rounded-full sm:size-6"
            style={{
              background: fans[i % fans.length],
              animationDelay: `${(i % 5) * 0.35}s`,
              marginTop: i % 2 ? 8 : 0,
            }}
          />
        ))}
      </div>
      {/* centre circle + line */}
      <div className="absolute left-1/2 top-[48%] size-56 -translate-x-1/2 rounded-full border-[5px] border-white/25 sm:size-96" />
      <div className="absolute inset-x-0 top-[58%] h-1.5 bg-white/20" />
      {/* a ball rolls by */}
      <span className="ball-bounce absolute bottom-[10%] left-[6%] text-3xl opacity-70">⚽</span>
    </div>
  );
}

/** Sunset racetrack backdrop: hills, a road with moving lane dashes, a checkered finish. */
export function TrackScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute right-[10%] top-[8%] size-24 rounded-full bg-yellow-200 shadow-[0_0_80px_30px_rgba(253,224,71,0.8)] sm:size-36" />
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[24%] h-[22%] w-full"
      >
        <path
          d="M0 120V70C40 30 80 40 120 62S200 20 250 50 340 30 400 60V120Z"
          fill="#fb923c"
          opacity="0.55"
        />
        <path d="M0 120V90C60 60 110 80 170 70S300 50 400 85V120Z" fill="#c2410c" opacity="0.45" />
      </svg>
      <div className="absolute inset-x-0 bottom-[14%] h-3 bg-[repeating-linear-gradient(90deg,#fff_0_24px,transparent_24px_48px)] opacity-70" />
      <span className="absolute left-[4%] top-[12%] text-5xl opacity-80">☁️</span>
      <span className="absolute left-[40%] top-[6%] text-4xl opacity-70">☁️</span>
    </div>
  );
}

/** Soft floating shapes for the number and pattern games. */
export function BubblesScene({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="ball-bounce absolute rounded-full bg-white/30"
          style={{
            width: 20 + ((i * 13) % 40),
            height: 20 + ((i * 13) % 40),
            left: `${(i * 29) % 95}%`,
            top: `${(i * 17) % 90}%`,
            animationDelay: `${(i % 6) * 0.4}s`,
            animationDuration: `${3 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  );
}

