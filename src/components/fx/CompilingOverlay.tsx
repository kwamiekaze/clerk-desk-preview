import { useEffect, useState } from "react";
import { MatrixRain } from "./MatrixRain";
import { BUILDING_VIDEO_URL } from "@/lib/media-constants";

const STAGES = [
  "SCANNING REQUEST…",
  "DISPATCHING CLERKS…",
  "WRITING CODE…",
  "COMPILING INTERFACE…",
  "VALIDATING BUILD…",
];

export function CompilingOverlay({ open, label }: { open: boolean; label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!open) return;
    setI(0);
    const t = setInterval(() => setI((n) => (n + 1) % STAGES.length), 1400);
    return () => clearInterval(t);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      {BUILDING_VIDEO_URL ? (
        <video
          key={BUILDING_VIDEO_URL}
          src={BUILDING_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.18),transparent_60%)]" />
      )}
      <MatrixRain className="absolute inset-0 h-full w-full opacity-70" density={1.1} />
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/70">CodingClerks · compiling</div>
        <div className="font-mono text-xl text-primary drop-shadow-[0_0_12px_rgba(0,255,65,0.6)] sm:text-2xl">
          {STAGES[i]}
        </div>
        {label && <div className="max-w-md text-sm text-mute">{label}</div>}
        <div className="mt-2 h-[2px] w-64 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full w-1/3 animate-cc-marquee bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay [background:repeating-linear-gradient(0deg,rgba(0,255,65,0.06)_0px,rgba(0,255,65,0.06)_1px,transparent_1px,transparent_3px)]" />
    </div>
  );
}
