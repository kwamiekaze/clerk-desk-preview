import { useEffect, useRef } from "react";

// GPU-friendly digital-rain canvas. Respects prefers-reduced-motion and
// pauses via rAF gating when document.hidden. Fixed positioning; parent
// should control z-index and opacity via className.
export function MatrixRain({
  className = "",
  density = 1,
  fadeAlpha = 0.08,
}: {
  className?: string;
  density?: number;
  fadeAlpha?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    const fontSize = 14;
    const glyphs = "アカサタナハマヤラワイキシチニヒミリヰウクスツヌフムユルエケセテネヘメレヱオコソトノホモヨロヲンｦｧｨｩｪｫ0123456789<>{}[]$#%@";

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.max(8, Math.floor((width / fontSize) * density));
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
      speeds = new Array(columns).fill(0).map(() => 0.4 + Math.random() * 1.0);
      // paint initial black
      ctx!.fillStyle = "#030805";
      ctx!.fillRect(0, 0, width, height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduced) {
      // Static faint glyph grid
      ctx.fillStyle = "#030805";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `${fontSize}px "Geist Mono Variable", ui-monospace, monospace`;
      ctx.fillStyle = "rgba(0,255,65,0.10)";
      for (let x = 0; x < columns; x++) {
        for (let y = 0; y < height / fontSize; y++) {
          if (Math.random() > 0.7) continue;
          ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], x * fontSize, (y + 1) * fontSize);
        }
      }
      return () => ro.disconnect();
    }

    let raf = 0;
    function frame() {
      if (document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }
      ctx!.fillStyle = `rgba(3, 8, 5, ${fadeAlpha})`;
      ctx!.fillRect(0, 0, width, height);
      ctx!.font = `${fontSize}px "Geist Mono Variable", ui-monospace, monospace`;
      for (let i = 0; i < columns; i++) {
        const char = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        // leader glyph glow
        if (Math.random() > 0.985) {
          ctx!.fillStyle = "#c8ffdd";
          ctx!.shadowColor = "#00FF41";
          ctx!.shadowBlur = 8;
        } else {
          ctx!.fillStyle = `rgba(0, 255, 65, ${0.55 + Math.random() * 0.35})`;
          ctx!.shadowBlur = 0;
        }
        ctx!.fillText(char, x, y);
        ctx!.shadowBlur = 0;
        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += speeds[i];
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [density, fadeAlpha]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
