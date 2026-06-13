import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { billingApi, type PointBalance } from "@/lib/mock/billing";
import { formatCP } from "@/lib/format";
import { DailyResetCountdown } from "@/components/billing/DailyResetCountdown";
import { BalancePopover } from "@/components/billing/BalancePopover";

/**
 * Sidebar/header CP balance. `compact` renders the header popover button.
 * Server-authoritative balance is fetched from billingApi.getBalance().
 */
export function PointsBadge({ compact = false }: { compact?: boolean }) {
  const [bal, setBal] = useState<PointBalance | null>(null);

  useEffect(() => {
    billingApi.getBalance().then(setBal);
  }, []);

  if (compact) return <BalancePopover />;

  // Usage bar shows period consumed vs. period grant (monthly + rollover + purchased).
  const period = (bal?.byBucket.monthly ?? 0) + (bal?.byBucket.rollover ?? 0) + (bal?.byBucket.purchased ?? 0);
  const pct = bal && period > 0
    ? Math.max(2, Math.min(100, Math.round((period / Math.max(period + 8, 1)) * 100)))
    : 0;

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
          Coding Points
        </div>
        <Link
          to="/app/billing"
          className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-mute hover:border-primary/50 hover:text-primary"
        >
          <Zap className="h-2.5 w-2.5" /> top up
        </Link>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tracking-tight">{bal ? formatCP(bal.total) : "—"}</span>
        <span className="font-mono text-[11px] text-mute">CP available</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-mute">
        <span>monthly resets {bal ? new Date(bal.monthlyResetAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}</span>
      </div>
      {bal && (
        <div className="mt-1">
          <DailyResetCountdown resetAt={bal.dailyResetAt} compact />
        </div>
      )}
    </div>
  );
}
