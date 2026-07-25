import { useEffect, useState } from "react";

const CHARS = "アカサタナ0123456789<>{}[]#$%&*";

export function ScrambleText({
  text,
  className = "",
  duration = 900,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  duration?: number;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(text);
      return;
    }
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration);
      const out = text
        .split("")
        .map((c, i) => {
          const revealAt = (i / text.length) * 0.75;
          if (p >= revealAt + 0.25 || c === " ") return c;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      setDisplay(out);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);

  const Comp = Tag as unknown as React.ElementType;
  return <Comp className={className}>{display}</Comp>;
}
