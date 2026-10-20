import { useMemo } from "react";

/** Deterministic pseudo-random so the stars are the same on server and client. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Bat({ top, delay, size }: { top: string; delay: number; size: number }) {
  return (
    <div
      className="bat absolute left-0"
      style={{ top, animationDelay: `${delay}s`, width: size, opacity: 0.85 }}
    >
      <svg viewBox="0 0 64 28" aria-hidden>
        <path
          d="M32 8c-3 0-4 3-6 3-3 0-4-4-9-5C10 5 4 8 1 13c4-1 8 0 10 3 2-1 4-1 6 1 2-2 5-2 7 1 2-3 5-5 8-5s6 2 8 5c2-3 5-3 7-1 2-2 4-2 6-1 2-3 6-4 10-3-3-5-9-8-16-7-5 1-6 5-9 5-2 0-3-3-6-3Z"
          fill="#0b0720"
        />
      </svg>
    </div>
  );
}

function Pumpkin({ x, size }: { x: string; size: number }) {
  return (
    <svg
      viewBox="0 0 80 70"
      className="absolute bottom-[1.5%]"
      style={{ left: x, width: size }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`pg-${x}`} cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#e8590c" />
        </radialGradient>
      </defs>
      <rect x="36" y="2" width="8" height="14" rx="3" fill="#2f6b2f" />
      <ellipse cx="40" cy="42" rx="36" ry="27" fill={`url(#pg-${x})`} />
      <path
        d="M40 15c-9 8-9 46 0 54M40 15c9 8 9 46 0 54"
        stroke="#c2410c"
        strokeWidth="2"
        fill="none"
      />
      <path d="M26 36l7 7-14 0Z M54 36l7 7-14 0Z" fill="#fde047" className="flicker" />
      <path
        d="M26 52q14 9 28 0"
        stroke="#fde047"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        className="flicker"
      />
    </svg>
  );
}

/** The spooky-but-friendly night sky behind the Ghost Game. Pure decoration. */
export function NightScene() {
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: `${rand(i + 1) * 100}%`,
        top: `${rand(i + 77) * 52}%`,
        size: 2 + rand(i + 5) * 3.5,
        delay: rand(i + 9) * 4,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="twinkle absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            boxShadow: "0 0 6px 1px rgba(255,255,255,0.8)",
          }}
        />
      ))}

      {/* the moon */}
      <div
        className="absolute right-[7%] top-[7%] size-24 rounded-full sm:size-36"
        style={{
          background: "radial-gradient(circle at 35% 35%, #fffbe6 0%, #fde68a 60%, #f4c95d 100%)",
          boxShadow: "0 0 50px 18px rgba(253,230,138,0.45), 0 0 140px 50px rgba(253,230,138,0.2)",
        }}
      >
        <span className="absolute left-[22%] top-[30%] size-[16%] rounded-full bg-amber-200/70" />
        <span className="absolute left-[55%] top-[52%] size-[22%] rounded-full bg-amber-200/60" />
        <span className="absolute left-[38%] top-[68%] size-[10%] rounded-full bg-amber-200/70" />
      </div>

      <Bat top="14%" delay={0} size={46} />
      <Bat top="26%" delay={6} size={34} />
      <Bat top="9%" delay={11} size={28} />

      {/* haunted hill and house */}
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[42%] w-full"
      >
        <path d="M0 150Q80 110 170 140T400 120V200H0Z" fill="#1a0f3c" />
        <g fill="#0d0826">
          <rect x="250" y="78" width="70" height="70" />
          <path d="M244 80 285 48 326 80Z" />
          <rect x="300" y="52" width="9" height="22" />
          <rect x="226" y="100" width="30" height="48" />
          <path d="M222 102 241 82 260 102Z" />
          <rect x="318" y="96" width="24" height="52" />
          <path d="M315 98 330 76 345 98Z" />
        </g>
        <g fill="#fcd34d" className="flicker">
          <rect x="262" y="96" width="12" height="16" rx="6" />
          <rect x="294" y="96" width="12" height="16" rx="6" />
          <rect x="278" y="122" width="12" height="26" rx="6" />
          <rect x="236" y="116" width="9" height="12" rx="4.5" />
          <rect x="324" y="112" width="9" height="13" rx="4.5" />
        </g>
        {/* spooky tree */}
        <g stroke="#0d0826" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M60 150V96M60 112 42 96M60 104 80 86M42 96 34 80M80 86 90 72" />
        </g>
        <path d="M0 170Q100 140 200 165T400 150V200H0Z" fill="#0d0826" />
      </svg>

      <div
        className="fog absolute inset-x-[-20%] bottom-[10%] h-[18%] rounded-full opacity-60 blur-2xl"
        style={{
          background: "linear-gradient(90deg, transparent, #e9d5ff 30%, #fbcfe8 60%, transparent)",
        }}
      />
      <div
        className="fog absolute inset-x-[-20%] bottom-0 h-[14%] rounded-full opacity-50 blur-2xl"
        style={{
          animationDirection: "alternate-reverse",
          animationDuration: "24s",
          background: "linear-gradient(90deg, transparent, #c4b5fd 35%, #ddd6fe 70%, transparent)",
        }}
      />

      <Pumpkin x="3%" size={64} />
      <Pumpkin x="86%" size={52} />
    </div>
  );
}
