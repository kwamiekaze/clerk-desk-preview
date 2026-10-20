import { useState } from "react";

const COLORS = ["#ef4444", "#3b82f6", "#facc15", "#22c55e", "#fb923c", "#a855f7", "#f472b6"];

/** Falling confetti. Only mount this after a user action (it uses random values). */
export function Confetti({ count = 44 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2.4 + Math.random() * 2,
      size: 8 + Math.random() * 10,
      color: COLORS[i % COLORS.length],
      round: Math.random() > 0.5,
    })),
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
