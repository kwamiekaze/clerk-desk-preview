import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { countdownTo } from "@/lib/format";

/**
 * Shows time until daily Coding Points reset (midnight UTC).
 * Server is authoritative for grants; this is a presentational countdown only.
 */
export function DailyResetCountdown({ resetAt, compact = false }: { resetAt: string; compact?: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = countdownTo(resetAt);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-mute">
        <Clock className="h-3 w-3" /> resets in {remaining}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5 font-mono text-[11px] text-mute">
      <Clock className="h-3 w-3 text-primary" />
      <span>Daily CP resets in</span>
      <span className="text-foreground">{remaining}</span>
      <span className="opacity-60">· midnight UTC</span>
    </div>
  );
}
