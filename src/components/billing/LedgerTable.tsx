import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Receipt, Gift, CalendarX, AlertCircle } from "lucide-react";
import { billingApi, BUCKET_LABEL, type PointLedgerEntry } from "@/lib/mock/billing";
import { timeAgo } from "@/lib/format";

const FILTERS: Array<{ id: "all" | PointLedgerEntry["kind"]; label: string }> = [
  { id: "all", label: "All" },
  { id: "charge", label: "Charges" },
  { id: "grant", label: "Grants" },
  { id: "expiry", label: "Expirations" },
];

export function LedgerTable() {
  const [rows, setRows] = useState<PointLedgerEntry[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]["id"]>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    billingApi.getLedger().then((r) => { setRows(r); setLoading(false); });
  }, []);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.kind === filter)),
    [rows, filter],
  );

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Filter</span>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              filter === f.id
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-mute hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 font-mono text-xs text-mute">Loading ledger…</div>
      ) : visible.length === 0 ? (
        <div className="p-6 text-center text-sm text-mute">No ledger entries match this filter.</div>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((row) => (
            <LedgerRow
              key={row.id}
              entry={row}
              open={!!expanded[row.id]}
              onToggle={() => setExpanded((e) => ({ ...e, [row.id]: !e[row.id] }))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LedgerRow({
  entry,
  open,
  onToggle,
}: {
  entry: PointLedgerEntry;
  open: boolean;
  onToggle: () => void;
}) {
  if (entry.kind === "grant") {
    return (
      <li className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Gift className="h-4 w-4 text-primary" />
            <div className="min-w-0">
              <div className="truncate text-sm">{BUCKET_LABEL[entry.grant.bucket]} grant · {entry.grant.reason.replace(/_/g, " ")}</div>
              <div className="font-mono text-[11px] text-mute">{timeAgo(entry.at)} · expires {entry.grant.expiresAt ? new Date(entry.grant.expiresAt).toLocaleDateString() : "never"}</div>
            </div>
          </div>
          <div className="font-mono text-sm text-primary">+{entry.grant.amount} CP</div>
        </div>
      </li>
    );
  }
  if (entry.kind === "expiry") {
    return (
      <li className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CalendarX className="h-4 w-4 text-mute" />
            <div>
              <div className="text-sm">{BUCKET_LABEL[entry.bucket]} CP expired</div>
              <div className="font-mono text-[11px] text-mute">{timeAgo(entry.at)} · {entry.reason.replace(/_/g, " ")}</div>
            </div>
          </div>
          <div className="font-mono text-sm text-mute">−{entry.amount} CP</div>
        </div>
      </li>
    );
  }

  const r = entry.receipt;
  const failed = r.status === "provider_failed";
  return (
    <li>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-background/40"
      >
        <div className="flex min-w-0 items-center gap-3">
          {open ? <ChevronDown className="h-4 w-4 text-mute" /> : <ChevronRight className="h-4 w-4 text-mute" />}
          {failed ? <AlertCircle className="h-4 w-4 text-status-warn" /> : <Receipt className="h-4 w-4 text-foreground/70" />}
          <div className="min-w-0">
            <div className="truncate text-sm">
              {r.projectName} · <span className="text-mute">{r.clerk} / {r.taskType}</span>
            </div>
            <div className="font-mono text-[11px] text-mute">
              {timeAgo(entry.at)} · {r.member.name} · route: {r.modelRoute}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-sm ${failed ? "text-status-warn" : "text-foreground"}`}>
            {failed ? "0 CP (failed)" : `−${r.finalCharge} CP`}
          </div>
          <div className="font-mono text-[10px] text-mute">est {r.estimatedRange.min}–{r.estimatedRange.max}</div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border/60 bg-background/40 px-4 py-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Itemized receipt · {r.id}
          </div>
          <ul className="divide-y divide-border/60">
            {r.lines.map((l, i) => (
              <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-foreground/90">{l.label}</div>
                  {l.detail && <div className="font-mono text-[11px] text-mute">{l.detail}</div>}
                </div>
                <div className={`font-mono text-sm ${l.points < 0 ? "text-primary" : "text-foreground"}`}>
                  {l.points > 0 ? "+" : ""}{l.points} CP
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-mono text-xs">
            <span className="uppercase tracking-[0.18em] text-mute">Total charge</span>
            <span className={failed ? "text-status-warn" : "text-primary"}>
              {failed ? "0 CP — provider failed, no AI output" : `${r.finalCharge} CP`}
            </span>
          </div>
          {!failed && entry.kind === "charge" && (
            <div className="mt-1 font-mono text-[10px] text-mute">
              Deducted from: {entry.deductedFrom.map((b) => BUCKET_LABEL[b]).join(" → ")}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
