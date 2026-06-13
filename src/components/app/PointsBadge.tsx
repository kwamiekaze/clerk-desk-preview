import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { mockApi } from "@/lib/mock/service";
import type { PointsBalance } from "@/lib/mock/types";

export function PointsBadge({ compact = false }: { compact?: boolean }) {
  const [p, setP] = useState<PointsBalance | null>(null);

  useEffect(() => {
    mockApi.getPoints().then(setP);
  }, []);

  const pct = p ? Math.min(100, Math.round((p.available / p.monthly) * 100)) : 0;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-cc-pulse-dot" />
        <span className="text-foreground">{p ? p.available.toLocaleString() : "—"}</span>
        <span className="text-mute">CP</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
          Coding Points
        </div>
        <Link to="/app/billing" className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-mute hover:text-foreground">
          top up
        </Link>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tracking-tight">
          {p ? p.available.toLocaleString() : "—"}
        </span>
        <span className="font-mono text-[11px] text-mute">/ {p?.monthly.toLocaleString() ?? "—"} CP</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 font-mono text-[10px] text-mute">
        Resets {p ? new Date(p.resetsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
      </div>
    </div>
  );
}
