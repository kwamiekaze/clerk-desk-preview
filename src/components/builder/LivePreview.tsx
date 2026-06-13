import { useState } from "react";
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Camera, Terminal as TerminalIcon, Accessibility, AlertTriangle, Wrench } from "lucide-react";
import type { PreviewSize, BuildError } from "@/lib/mock/builder";

const SIZES: Record<PreviewSize, { w: number; h: number; icon: typeof Monitor; label: string }> = {
  desktop: { w: 1280, h: 800, icon: Monitor,    label: "Desktop" },
  tablet:  { w: 820,  h: 1180, icon: Tablet,    label: "Tablet" },
  mobile:  { w: 390,  h: 844,  icon: Smartphone, label: "Mobile" },
};

export function LivePreview({
  url, errors, onRepair,
}: {
  url: string;
  errors: BuildError[];
  onRepair: () => void;
}) {
  const [size, setSize] = useState<PreviewSize>("desktop");
  const [bust, setBust] = useState(0);
  const [showConsole, setShowConsole] = useState(false);
  const cfg = SIZES[size];

  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface/40 px-3 py-2">
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
          {(Object.keys(SIZES) as PreviewSize[]).map((k) => {
            const Icon = SIZES[k].icon;
            return (
              <button
                key={k}
                onClick={() => setSize(k)}
                title={SIZES[k].label}
                className={`inline-flex h-7 w-7 items-center justify-center rounded ${size === k ? "bg-surface text-primary" : "text-mute hover:text-foreground"}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
        <div className="font-mono text-[10px] text-mute">{cfg.w}×{cfg.h}</div>
        <div className="flex items-center gap-1">
          <PreviewBtn icon={RefreshCw} label="Reload" onClick={() => setBust((b) => b + 1)} />
          <PreviewBtn icon={Camera} label="Screenshot" />
          <PreviewBtn icon={TerminalIcon} label="Console" active={showConsole} onClick={() => setShowConsole((s) => !s)} />
          <PreviewBtn icon={Accessibility} label="A11y audit" />
          <PreviewBtn icon={ExternalLink} label="Open" onClick={() => window.open(url, "_blank")} />
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#06070A] p-4">
        <div
          className={`mx-auto rounded-md border border-border bg-surface shadow-2xl ${reduceMotion ? "" : "transition-all duration-300"}`}
          style={{ width: Math.min(cfg.w, 1600), aspectRatio: `${cfg.w} / ${cfg.h}`, maxWidth: "100%" }}
        >
          <div className="h-7 rounded-t-md border-b border-border bg-background/60 px-3 font-mono text-[10px] leading-7 text-mute">
            <span className="mr-2 inline-flex gap-1 align-middle">
              <span className="h-2 w-2 rounded-full bg-mute/40" />
              <span className="h-2 w-2 rounded-full bg-mute/40" />
              <span className="h-2 w-2 rounded-full bg-mute/40" />
            </span>
            {url}{bust ? `?r=${bust}` : ""}
          </div>
          <div className="grid h-[calc(100%-1.75rem)] place-items-center bg-gradient-to-br from-background to-surface text-center font-mono text-[10px] text-mute">
            <div className="space-y-2">
              <div className="text-primary">live preview</div>
              <div>sandbox: e2b · vercel-edge</div>
              <div className="text-mute/60">(Iframe wired to GET /api/sandbox/:id/preview)</div>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="pointer-events-auto absolute inset-x-4 bottom-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> {errors.length} build error{errors.length !== 1 && "s"}
              </div>
              <button onClick={onRepair} className="inline-flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-[11px] font-medium text-destructive-foreground">
                <Wrench className="h-3 w-3" /> Repair with clerk
              </button>
            </div>
            <ul className="space-y-1 font-mono text-[10px] text-foreground/80">
              {errors.slice(0, 3).map((e) => (
                <li key={e.id}>· [{e.source}] {e.message} <span className="text-mute">{e.file}:{e.line}</span></li>
              ))}
            </ul>
          </div>
        )}

        {showConsole && (
          <div className="absolute inset-x-4 bottom-4 max-h-48 overflow-auto rounded-lg border border-border bg-background/90 p-2 font-mono text-[10px] text-mute backdrop-blur">
            <div className="mb-1 text-foreground">console</div>
            <div>[hmr] update applied — 18ms</div>
            <div>[clerk] preview mounted</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewBtn({ icon: Icon, label, onClick, active }: { icon: typeof Monitor; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-border ${active ? "bg-primary/15 text-primary" : "bg-background text-mute hover:text-foreground"}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
