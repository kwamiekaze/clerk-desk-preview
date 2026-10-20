import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  mode: "idle" | "covered";
  className?: string;
};

const PUFFS = [
  { px: "-46px", py: "-30px" },
  { px: "-22px", py: "-62px" },
  { px: "6px", py: "-76px" },
  { px: "30px", py: "-58px" },
  { px: "52px", py: "-28px" },
  { px: "0px", py: "-30px" },
];

/**
 * Sonny John from his real photos. Idle: face showing, blanket held up.
 * Covered: the blanket drops over him (a puff of mist) and he floats around as a ghost.
 * Switching back pops the same photo of his face out again.
 */
export function SonnyGhost({ mode, className }: Props) {
  const [burst, setBurst] = useState(0);
  const prev = useRef(mode);

  useEffect(() => {
    if (prev.current !== mode) setBurst((b) => b + 1);
    prev.current = mode;
  }, [mode]);

  return (
    <div
      className={cn("sonny relative select-none", className)}
      data-mode={mode}
      role="img"
      aria-label={mode === "covered" ? "Sonny John as a ghost" : "Sonny John"}
    >
      <div className="sonny-sway relative aspect-[3/4] w-full">
        <img
          src="/ghost/sonny-peek.webp"
          alt=""
          draggable={false}
          className="sonny-img sonny-peek"
        />
        <img
          src="/ghost/sonny-ghost.webp"
          alt=""
          draggable={false}
          className="sonny-img sonny-ghost"
        />
      </div>

      {burst > 0 && (
        <div key={burst} className="pointer-events-none absolute inset-x-0 bottom-[22%]">
          {PUFFS.map((p, i) => (
            <span
              key={i}
              className="puff absolute left-1/2 size-8 rounded-full bg-white/90 blur-[3px] sm:size-12"
              style={
                {
                  ["--px"]: p.px,
                  ["--py"]: p.py,
                  animationDelay: `${i * 0.04}s`,
                } as React.CSSProperties
              }
            />
          ))}
          {mode === "idle" &&
            [-34, 0, 34].map((x, i) => (
              <span
                key={x}
                className="sparkle absolute left-1/2 text-2xl"
                style={{ marginLeft: x, top: -20 - i * 8, animationDelay: `${0.1 + i * 0.1}s` }}
              >
                ✨
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
