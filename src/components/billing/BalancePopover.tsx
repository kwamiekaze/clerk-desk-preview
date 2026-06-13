import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Zap, ChevronDown, Info } from "lucide-react";
import { billingApi, BUCKET_LABEL, SPEND_ORDER, type PointBalance } from "@/lib/mock/billing";
import { formatCP } from "@/lib/format";
import { DailyResetCountdown } from "./DailyResetCountdown";

const BUCKET_TIP: Record<keyof PointBalance["byBucket"], string> = {
  daily:        "Granted each day. Expires at midnight UTC.",
  promotional:  "From offers or onboarding. Spent before monthly CP.",
  monthly:      "Granted on subscription renewal.",
  rollover:     "Unspent monthly CP carried forward for one extra cycle.",
  purchased:    "Top-up purchases. Valid 12 months. Spent last.",
};

const BUCKET_DOT: Record<keyof PointBalance["byBucket"], string> = {
  daily:        "bg-status-ok",
  promotional:  "bg-secondary",
  monthly:      "bg-primary",
  rollover:     "bg-foreground/60",
  purchased:    "bg-status-warn",
};

/** Header CP balance with click-to-expand bucket popover. */
export function BalancePopover({ compact = true }: { compact?: boolean }) {
  const [bal, setBal] = useState<PointBalance | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    billingApi.getBalance().then(setBal);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const total = bal?.total ?? 0;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 transition-colors hover:border-border-strong ${
          compact ? "font-mono text-[11px]" : "text-sm"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-cc-pulse-dot" />
        <span className="text-foreground">{bal ? formatCP(total) : "—"}</span>
        <span className="text-mute">CP</span>
        <ChevronDown className={`h-3 w-3 text-mute transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Coding Points balance"
          className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-xl"
        >
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">Coding Points</div>
              <div className="mt-0.5 text-2xl font-semibold tracking-tight">{bal ? formatCP(total) : "—"} <span className="text-xs text-mute">CP</span></div>
            </div>
            <Link
              to="/app/billing"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Zap className="h-3 w-3" /> Top up
            </Link>
          </div>

          {bal && (
            <>
              <div className="mt-3 space-y-1.5">
                {SPEND_ORDER.map((b) => (
                  <div key={b} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-mute" title={BUCKET_TIP[b]}>
                      <span className={`h-1.5 w-1.5 rounded-full ${BUCKET_DOT[b]}`} />
                      {BUCKET_LABEL[b]}
                    </span>
                    <span className="font-mono text-foreground/90">{formatCP(bal.byBucket[b])} CP</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-border pt-2.5">
                <DailyResetCountdown resetAt={bal.dailyResetAt} compact />
                <div className="mt-1 font-mono text-[10px] text-mute">
                  Spend order: daily → promo → monthly → rollover → purchased
                </div>
              </div>

              <Link
                to="/app/billing"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
              >
                <Info className="h-3 w-3" /> View ledger & plans
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
