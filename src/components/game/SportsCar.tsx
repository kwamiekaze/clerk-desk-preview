import { useId } from "react";
import type { CarStyle } from "@/lib/content";

type Props = {
  color?: string | undefined; // hex, or "rainbow"
  style?: CarStyle | undefined;
  stripe?: string | undefined;
  /** Wheels spin when true. */
  driving?: boolean | undefined;
  /** Small number/letter on the door. */
  badge?: string | undefined;
  /** Dark silhouette for locked cars. */
  locked?: boolean | undefined;
  className?: string | undefined;
  label?: string | undefined;
};

function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  const digits = m?.[1];
  if (!digits) return hex;
  const n = parseInt(digits, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const BODY: Record<
  CarStyle,
  { d: string; windows: string[]; head: [number, number]; tail: [number, number] }
> = {
  coupe: {
    d: "M8 66 C8 57 14 53 30 51 L58 47 C68 35 80 29 96 28 L128 28 C142 29 152 38 160 47 C180 49 192 55 192 66 Z",
    windows: [
      "M70 46 C76 38 85 33 96 32 L108 32 L108 46 Z",
      "M113 32 L128 32 C136 33 142 39 148 46 L113 46 Z",
    ],
    head: [184, 57],
    tail: [10, 57],
  },
  wedge: {
    d: "M6 66 C6 58 12 55 26 54 L72 49 L106 31 C114 28 124 28 132 29 L152 41 L184 52 C192 55 194 60 194 66 Z",
    windows: ["M86 47 L106 34 L125 34 L139 45 Z"],
    head: [187, 59],
    tail: [8, 59],
  },
  roadster: {
    d: "M8 66 C8 58 14 54 28 52 L62 50 L74 41 L100 41 L110 50 L142 49 C162 49 178 51 188 57 C194 60 194 63 194 66 Z",
    windows: ["M75 43 L78 50 L98 50 L100 43 Z"],
    head: [187, 58],
    tail: [10, 58],
  },
  hyper: {
    d: "M8 66 C8 54 18 50 34 48 C48 30 72 26 94 26 C118 26 138 32 150 44 C176 46 194 52 194 66 Z",
    windows: ["M56 46 C64 35 76 31 94 31 L112 31 C124 33 134 38 140 45 Z"],
    head: [187, 57],
    tail: [10, 58],
  },
};

function Wheel({ cx, driving }: { cx: number; driving?: boolean | undefined }) {
  return (
    <g transform={`translate(${cx} 68)`}>
      <circle r="17" fill="#1f2937" />
      <g className={driving ? "wheel-spin" : undefined}>
        <circle r="14" fill="#111827" />
        <circle r="8.5" fill="#e5e7eb" />
        {[0, 72, 144, 216, 288].map((a) => (
          <line
            key={a}
            x1="0"
            y1="0"
            x2="0"
            y2="-8"
            stroke="#6b7280"
            strokeWidth="2.2"
            strokeLinecap="round"
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="3" fill="#9ca3af" />
      </g>
    </g>
  );
}

/** A cartoon sports car facing right. Pure SVG so it scales to any size. */
export function SportsCar({
  color = "#ef4444",
  style = "coupe",
  stripe,
  driving,
  badge,
  locked,
  className,
  label,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const b = BODY[style];
  const isRainbow = color === "rainbow";
  const fill = locked ? "#334155" : isRainbow ? `url(#rb${uid})` : color;
  const dark = locked ? "#1e293b" : isRainbow ? "#7c3aed" : shade(color, 0.35);
  const glass = locked ? "#475569" : "#bae6fd";

  return (
    <svg
      viewBox="0 0 200 90"
      className={className}
      role="img"
      aria-label={label ?? "sports car"}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`rb${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="0.2" stopColor="#fb923c" />
          <stop offset="0.4" stopColor="#facc15" />
          <stop offset="0.6" stopColor="#22c55e" />
          <stop offset="0.8" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={`gl${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`cp${uid}`}>
          <path d={b.d} />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy="84" rx="88" ry="5" fill="#000" opacity="0.18" />

      {/* hyper-car wing sits behind the body */}
      {style === "hyper" && (
        <g>
          <path
            d="M16 48 L18 38 M28 48 L26 38"
            stroke={dark}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="4" y="33" width="36" height="6" rx="3" fill={dark} />
        </g>
      )}

      {/* cheerful driver in the open roadster */}
      {style === "roadster" && !locked && (
        <g>
          <circle cx="88" cy="35" r="7" fill="#fcd9b6" />
          <path d="M80 35 A8 8 0 0 1 96 35 L96 36 L80 36 Z" fill="#fff" />
          <rect x="80" y="30" width="16" height="3" fill="#ef4444" />
          <circle cx="91" cy="37" r="1.1" fill="#1f2937" />
          <path
            d="M86 40 Q89 42.5 92 40"
            stroke="#1f2937"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* body */}
      <path d={b.d} fill={fill} />
      <g clipPath={`url(#cp${uid})`}>
        <rect x="0" y="62" width="200" height="6" fill="#000" opacity="0.2" />
        {stripe && !locked && <rect x="0" y="53" width="200" height="5" fill={stripe} />}
        <path d={b.d} fill={`url(#gl${uid})`} />
      </g>

      {/* windows */}
      {b.windows.map((w) => (
        <path key={w} d={w} fill={glass} stroke={dark} strokeWidth="1.5" strokeLinejoin="round" />
      ))}

      {/* door line + handle */}
      {style !== "roadster" && (
        <path d="M110 33 L110 62" stroke={dark} strokeWidth="1.5" opacity="0.7" />
      )}
      <rect x="116" y="50" width="9" height="2.4" rx="1.2" fill={dark} />

      {/* lights */}
      {!locked && (
        <>
          <ellipse
            cx={b.head[0]}
            cy={b.head[1]}
            rx="5"
            ry="3.4"
            fill="#fef08a"
            stroke="#f59e0b"
            strokeWidth="1"
          />
          <rect x={b.tail[0] - 3} y={b.tail[1] - 3} width="6" height="6" rx="2" fill="#dc2626" />
        </>
      )}

      {badge && !locked && (
        <g>
          <circle cx="94" cy="55" r="8" fill="#fff" />
          <text
            x="94"
            y="59.5"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="#1f2937"
            fontFamily="inherit"
          >
            {badge}
          </text>
        </g>
      )}

      <Wheel cx={48} driving={driving} />
      <Wheel cx={152} driving={driving} />
    </svg>
  );
}
