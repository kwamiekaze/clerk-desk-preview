import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Loader2, ExternalLink } from "lucide-react";

type Stage = { id: string; clerk: string; label: string };

const STAGES: Stage[] = [
  { id: "intake", clerk: "intake", label: "Parsing brief" },
  { id: "tokens", clerk: "designer", label: "Lifting design tokens" },
  { id: "scaffold", clerk: "engineer", label: "Scaffolding React app" },
  { id: "wire", clerk: "engineer", label: "Wiring routes and state" },
  { id: "qa", clerk: "qa", label: "Type-check and a11y pass" },
  { id: "preview", clerk: "preview", label: "Spinning up sandbox" },
];

export function InitProgress({ projectId }: { projectId: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STAGES.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1400);
    return () => clearTimeout(t);
  }, [step]);

  const done = step >= STAGES.length;
  const pct = Math.round((Math.min(step, STAGES.length) / STAGES.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-xl border border-border-strong bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            Initializing · {projectId}
          </div>
          <span className="font-mono text-[11px] text-mute">{pct}%</span>
        </div>
        <div className="h-1 overflow-hidden bg-surface-2">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <ol className="divide-y divide-border">
          {STAGES.map((s, i) => {
            const isDone = i < step;
            const isRunning = i === step && !done;
            return (
              <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-6 w-6 place-items-center rounded-full border border-border bg-background">
                  {isDone ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : isRunning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="block text-sm text-foreground">{s.label}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-mute">
                    {s.clerk}
                  </span>
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider ${
                    isDone ? "text-primary" : isRunning ? "text-status-run" : "text-mute"
                  }`}
                >
                  {isDone ? "ok" : isRunning ? "run" : "idle"}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="border-t border-border px-5 py-3 font-mono text-[11px] text-mute">
          {done ? (
            <span>
              <span className="text-primary">▍</span> sandbox ready — preview link issued
            </span>
          ) : (
            <span>
              <span className="text-primary">▍</span> clerks at work
              <span className="ml-0.5 inline-block animate-cc-blink">_</span>
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
          What happens next
        </div>
        <ul className="mt-3 space-y-3 text-sm text-foreground/90">
          <li>1. A shareable preview URL appears in the ledger.</li>
          <li>2. You comment on the live preview — clerks respond inline.</li>
          <li>3. Approve to export to GitHub and promote to Vercel.</li>
        </ul>
        {done && (
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              Open preview
            </a>
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2 text-sm hover:border-border-strong"
            >
              Back to library
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
