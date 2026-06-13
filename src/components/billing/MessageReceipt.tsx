import { X, Globe, ShieldCheck, Clock, Receipt as ReceiptIcon } from "lucide-react";
import type { UsageReceipt } from "@/lib/mock/billing";
import { formatCP } from "@/lib/format";

const STATUS_TONE: Record<UsageReceipt["status"], string> = {
  completed: "border-status-ok/40 bg-status-ok/10 text-status-ok",
  partial:   "border-secondary/40 bg-secondary/10 text-secondary",
  failed:    "border-status-warn/40 bg-status-warn/10 text-status-warn",
  refunded:  "border-border bg-background text-mute",
};

/**
 * Per-message receipt modal — friendly customer view. Does NOT expose
 * raw provider COGS or internal margin.
 */
export function MessageReceipt({
  open,
  receipt,
  onClose,
}: {
  open: boolean;
  receipt: UsageReceipt | null;
  onClose: () => void;
}) {
  if (!open || !receipt) return null;

  const showLines = receipt.status !== "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-labelledby="receipt-title">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 sm:rounded-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-background hover:text-foreground"
          aria-label="Close receipt"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <ReceiptIcon className="h-4 w-4 text-primary" />
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Receipt</div>
        </div>
        <h3 id="receipt-title" className="mt-1 text-lg font-semibold tracking-tight">{receipt.taskTypeLabel}</h3>
        <div className="mt-0.5 font-mono text-[11px] text-mute">{receipt.projectName}</div>

        <div className="mt-4 grid gap-2">
          <Row label="Estimate"        value={`${formatCP(receipt.estimatedRange.min)}–${formatCP(receipt.estimatedRange.max)} CP`} />
          <Row label="Final charge"    value={
            <span className={receipt.status === "failed" ? "text-status-warn" : "text-foreground"}>
              {receipt.status === "failed" ? "0 CP" : `${formatCP(receipt.finalCharge)} CP`}
            </span>
          } />
          <Row label="Status"          value={
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_TONE[receipt.status]}`}>
              {receipt.status}
            </span>
          } />
          <Row label="Model route"     value={receipt.modelRouteLabel} />
          <Row label="Firecrawl used"  value={
            <span className="inline-flex items-center gap-1">
              <Globe className={`h-3 w-3 ${receipt.firecrawlUsed ? "text-primary" : "opacity-50"}`} />
              {receipt.firecrawlUsed ? "Yes" : "No"}
            </span>
          } />
          <Row label="Build validation" value={
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className={`h-3 w-3 ${receipt.validationCompleted ? "text-status-ok" : "opacity-50"}`} />
              {receipt.validationCompleted ? "Completed" : "Skipped"}
            </span>
          } />
          <Row label="Duration"        value={
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(receipt.durationMs / 1000).toFixed(1)}s
            </span>
          } />
          <Row label="Completed"       value={new Date(receipt.at).toLocaleString()} />
        </div>

        {showLines && receipt.lines.length > 0 && (
          <div className="mt-4 rounded-md border border-border bg-background/60 p-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Itemized</div>
            <ul className="divide-y divide-border/60">
              {receipt.lines.map((l, i) => (
                <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-foreground/90">{l.label}</div>
                    {l.detail && <div className="font-mono text-[11px] text-mute">{l.detail}</div>}
                  </div>
                  <div className={`font-mono text-sm ${l.points < 0 ? "text-primary" : "text-foreground"}`}>
                    {l.points > 0 ? "+" : ""}{formatCP(l.points)} CP
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {receipt.status === "failed" && (
          <p className="mt-3 rounded-md border border-status-warn/40 bg-status-warn/5 p-3 text-xs text-foreground/90">
            The provider failed before any usable output. You were not charged.
          </p>
        )}
        {receipt.status === "partial" && (
          <p className="mt-3 rounded-md border border-secondary/40 bg-secondary/5 p-3 text-xs text-foreground/90">
            Only the completed portion was charged. Ask the clerk to continue when you&apos;re ready.
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="text-mute">{label}</span>
      <span className="font-mono text-[12px] text-foreground/90">{value}</span>
    </div>
  );
}
