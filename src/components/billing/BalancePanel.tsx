import { BUCKET_LABEL, SPEND_ORDER, type PointBalance } from "@/lib/mock/billing";
import { formatCP } from "@/lib/format";
import { DailyResetCountdown } from "./DailyResetCountdown";

export function BalancePanel({ balance, onTopUp }: { balance: PointBalance; onTopUp: () => void }) {
  const dailyPct = Math.min(100, Math.round((balance.dailyUsedThisMonth / balance.dailyCapThisMonth) * 100));
  // Period usage bar: roughly portion of granted CP still on hand
  const granted = SPEND_ORDER.reduce((s, b) => s + balance.byBucket[b], 0) + 0.001;
  const periodPct = Math.min(100, Math.round((balance.total / granted) * 100));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Coding Points balance</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight">{formatCP(balance.total)}</span>
            <span className="font-mono text-[12px] text-mute">CP available</span>
          </div>
          <div className="mt-2">
            <DailyResetCountdown resetAt={balance.dailyResetAt} compact />
          </div>
        </div>
        <button
          onClick={onTopUp}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Top up
        </button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {SPEND_ORDER.map((b, i) => (
          <div key={b} className="rounded-md border border-border bg-background/60 p-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-mute">
              <span>{i + 1}. {BUCKET_LABEL[b]}</span>
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{formatCP(balance.byBucket[b])}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border/60 bg-background/40 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mute">This billing period</span>
            <span className="font-mono text-foreground/90">{formatCP(balance.total)} CP remaining</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${periodPct}%` }} />
          </div>
          <p className="mt-2 font-mono text-[10px] text-mute">
            Renews {new Date(balance.monthlyResetAt).toLocaleDateString()}.
          </p>
        </div>

        <div className="rounded-md border border-border/60 bg-background/40 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mute">Daily grants this month</span>
            <span className="font-mono text-foreground/90">{balance.dailyUsedThisMonth} / {balance.dailyCapThisMonth} CP</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-status-ok" style={{ width: `${dailyPct}%` }} />
          </div>
          <p className="mt-2 font-mono text-[10px] text-mute">
            Spend order: {SPEND_ORDER.map((b) => BUCKET_LABEL[b].toLowerCase()).join(" → ")}.
          </p>
        </div>
      </div>
    </div>
  );
}
