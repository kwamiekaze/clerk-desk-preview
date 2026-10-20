import { useId } from "react";
import { cn } from "@/lib/utils";

/** Gold number badge for counted items. */
export function CountBadge({ n }: { n: number }) {
  return (
    <span className="badge-pop absolute -right-1 -top-2 z-10 grid size-8 place-items-center rounded-full bg-amber-400 text-lg font-extrabold text-purple-950 shadow-lg ring-2 ring-white sm:size-11 sm:text-2xl">
      {n}
    </span>
  );
}

/** A glossy black-and-white soccer ball. */
export function Ball({ className, gone }: { className?: string; gone?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-full w-full overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}b`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="94" rx="30" ry="5" fill="rgba(0,0,0,0.22)" />
      <circle
        cx="50"
        cy="48"
        r="44"
        fill={gone ? "none" : `url(#${id}b)`}
        stroke={gone ? "rgba(255,255,255,0.7)" : "#1e293b"}
        strokeWidth={gone ? 3 : 3}
        strokeDasharray={gone ? "6 5" : undefined}
      />
      {!gone && (
        <g fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M50 28l13 9.5-5 15H42l-5-15z" />
          <path d="M50 28V12M63 37.5l16-6M58 52.5l9 14M42 52.5l-9 14M37 37.5l-16-6" fill="none" />
          <path d="M79 31.5l11 12-6 8-11-4zM21 31.5l-11 12 6 8 11-4zM67 66.5l-3 15H36l-3-15 8-5h18z" />
        </g>
      )}
      {!gone && (
        <ellipse
          cx="34"
          cy="26"
          rx="12"
          ry="6"
          fill="#fff"
          opacity="0.7"
          transform="rotate(-30 34 26)"
        />
      )}
    </svg>
  );
}

const SKIN = ["#8d5524", "#c68642", "#e0ac69", "#6b4423"];

/** A little soccer player in a team shirt with a number. */
export function Player({
  team,
  n,
  seed = 0,
  className,
}: {
  team: "blue" | "gold";
  n: number;
  seed?: number;
  className?: string;
}) {
  const shirt = team === "blue" ? "#2563eb" : "#f59e0b";
  const shirt2 = team === "blue" ? "#1d4ed8" : "#d97706";
  const sock = team === "blue" ? "#1d4ed8" : "#111827";
  const skin = SKIN[seed % SKIN.length] ?? "#8d5524";
  return (
    <svg
      viewBox="0 0 80 120"
      className={cn("h-full w-full overflow-visible", className)}
      aria-hidden
    >
      <ellipse cx="40" cy="116" rx="22" ry="4" fill="rgba(0,0,0,0.25)" />
      {/* legs + socks + boots */}
      <rect x="27" y="78" width="9" height="26" rx="3" fill={skin} />
      <rect x="44" y="78" width="9" height="26" rx="3" fill={skin} />
      <rect x="27" y="92" width="9" height="14" rx="3" fill={sock} />
      <rect x="44" y="92" width="9" height="14" rx="3" fill={sock} />
      <ellipse cx="30" cy="109" rx="8" ry="4.5" fill="#111827" />
      <ellipse cx="50" cy="109" rx="8" ry="4.5" fill="#111827" />
      {/* shorts */}
      <path d="M24 68h32l3 20H41l-1-6-1 6H21z" fill="#0f172a" />
      {/* arms */}
      <rect x="12" y="44" width="10" height="22" rx="5" fill={skin} transform="rotate(14 17 44)" />
      <rect x="58" y="44" width="10" height="22" rx="5" fill={skin} transform="rotate(-14 63 44)" />
      {/* shirt */}
      <path
        d="M20 44l12-6h16l12 6-4 12-6-3v19H30V53l-6 3z"
        fill={shirt}
        stroke={shirt2}
        strokeWidth="2"
      />
      <text
        x="40"
        y="66"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fill="#fff"
        fontFamily="Fredoka, sans-serif"
      >
        {n % 10 || 10}
      </text>
      {/* head + hair */}
      <circle cx="40" cy="26" r="15" fill={skin} />
      <path d="M25 24c0-12 8-16 15-16s15 4 15 16c-4-5-9-7-15-7s-11 2-15 7z" fill="#1f1308" />
      <circle cx="35" cy="28" r="1.8" fill="#111" />
      <circle cx="45" cy="28" r="1.8" fill="#111" />
      <path
        d="M34 34c3 3 9 3 12 0"
        stroke="#111"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

