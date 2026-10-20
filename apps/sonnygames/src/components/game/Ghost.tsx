import { cn } from "@/lib/utils";

export type GhostTint = "white" | "lilac" | "mint" | "peach";

const TINTS: Record<GhostTint, [string, string]> = {
  white: ["#ffffff", "#dcd6ff"],
  lilac: ["#f3e8ff", "#c4a8ff"],
  mint: ["#ecfdf5", "#9be8cf"],
  peach: ["#fff1e6", "#ffc29b"],
};

type Props = {
  tint?: GhostTint;
  /** 0 plain, 1 bow, 2 top hat, 3 star crown - just for variety */
  variant?: number;
  number?: number | undefined;
  counted?: boolean;
  /** Dotted outline left behind by a ghost that flew away. */
  gone?: boolean;
  className?: string;
  id?: string;
};

/** A cute, glowing ghost with a wavy hem. Eyes blink; counted ghosts get a gold halo and number. */
export function Ghost({
  tint = "white",
  variant = 0,
  number,
  counted,
  gone,
  className,
  id,
}: Props) {
  const [from, to] = TINTS[tint];
  const gid = `gh-${id ?? tint}-${variant}`;
  return (
    <div className={cn("relative aspect-[4/5] w-full", className)}>
      <svg viewBox="0 0 100 125" className="h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
          <radialGradient id={`${gid}-halo`}>
            <stop offset="0" stopColor="#fde047" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fde047" stopOpacity="0" />
          </radialGradient>
        </defs>

        {counted && <ellipse cx="50" cy="58" rx="62" ry="68" fill={`url(#${gid}-halo)`} />}

        <path
          d="M50 8C27 8 14 26 14 50v52c0 5 5 7 9 3l7-7c3-3 7-3 10 0l6 6c3 3 7 3 10 0l6-6c3-3 7-3 10 0l7 7c4 4 9 2 9-3V50C88 26 73 8 50 8Z"
          fill={gone ? "none" : `url(#${gid})`}
          stroke={gone ? "rgba(255,255,255,0.55)" : counted ? "#fbbf24" : "rgba(255,255,255,0.9)"}
          strokeWidth={gone ? 2.5 : counted ? 3.5 : 2}
          strokeDasharray={gone ? "5 5" : undefined}
          style={{ filter: gone ? "none" : "drop-shadow(0 0 7px rgba(221,214,254,0.85))" }}
        />

        {!gone && (
          <>
            {/* arms */}
            <path
              d="M16 70c-9-2-12 6-8 10M84 70c9-2 12 6 8 10"
              stroke={to}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* eyes with sparkle */}
            <g className="ghost-eye">
              <ellipse cx="38" cy="48" rx="6.5" ry="8.5" fill="#241447" />
              <ellipse cx="62" cy="48" rx="6.5" ry="8.5" fill="#241447" />
              <circle cx="40" cy="45" r="2.4" fill="#fff" />
              <circle cx="64" cy="45" r="2.4" fill="#fff" />
            </g>
            {/* blush + smile */}
            <ellipse cx="29" cy="62" rx="6" ry="3.6" fill="#ff9db8" opacity="0.7" />
            <ellipse cx="71" cy="62" rx="6" ry="3.6" fill="#ff9db8" opacity="0.7" />
            <path
              d="M43 64q7 8 14 0"
              stroke="#241447"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />

            {variant === 1 && (
              <g>
                <path d="M50 12 36 4v14ZM50 12 64 4v14Z" fill="#ff6fa5" />
                <circle cx="50" cy="12" r="4.5" fill="#ff3d86" />
              </g>
            )}
            {variant === 2 && (
              <g>
                <rect x="30" y="6" width="40" height="5" rx="2.5" fill="#1f1147" />
                <rect x="37" y="-14" width="26" height="22" rx="3" fill="#1f1147" />
                <rect x="37" y="-3" width="26" height="5" fill="#a78bfa" />
              </g>
            )}
            {variant === 3 && (
              <path
                d="M32 14 36 -2 44 8 50 -6 56 8 64 -2 68 14Z"
                fill="#fbbf24"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            )}
          </>
        )}
      </svg>

      {number !== undefined && (
        <span
          className="badge-pop absolute -right-1 -top-2 grid size-9 place-items-center rounded-full bg-amber-400 text-xl font-extrabold text-purple-950 shadow-lg ring-2 ring-white sm:size-12 sm:text-3xl"
          aria-hidden
        >
          {number}
        </span>
      )}
    </div>
  );
}
