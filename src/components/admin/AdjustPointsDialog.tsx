import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { adminApi, type AdminUser, type PointAdjustment } from "@/lib/mock/admin";

const REASONS: Array<{ id: PointAdjustment["reason"]; label: string }> = [
  { id: "refund_provider_failure", label: "Refund · provider failure" },
  { id: "goodwill",                label: "Goodwill credit" },
  { id: "abuse_clawback",          label: "Abuse clawback" },
  { id: "manual_grant",            label: "Manual grant" },
  { id: "support_correction",      label: "Support correction" },
];

export function AdjustPointsDialog({ open, user, onClose }: { open: boolean; user: AdminUser | null; onClose: () => void }) {
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<PointAdjustment["reason"]>("goodwill");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<PointAdjustment | null>(null);

  if (!open || !user) return null;

  async function submit() {
    setSubmitting(true);
    const adj = await adminApi.adjustPoints({ userId: user!.id, amount, reason, note });
    setDone(adj);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 sm:rounded-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-background hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Admin · point adjustment</div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">{user.name}</h3>
        <p className="mt-1 font-mono text-[11px] text-mute">{user.email} · current {user.pointsAvailable} CP</p>

        {done ? (
          <div className="mt-5 rounded-md border border-status-ok/40 bg-status-ok/5 p-4">
            <div className="text-sm">Recorded adjustment <span className="font-mono">{done.id}</span>.</div>
            <p className="mt-1 font-mono text-[11px] text-mute">Audit row written. The user will be notified per their preferences.</p>
            <button onClick={onClose} className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Done</button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Amount (negative = clawback)</span>
                <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)} className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Reason</span>
                <select value={reason} onChange={(e) => setReason(e.target.value as PointAdjustment["reason"])} className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {REASONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Audit note (required)</span>
                <textarea required rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ticket #, root cause, customer-visible explanation…" className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </label>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-md border border-status-warn/40 bg-status-warn/5 p-3 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-status-warn" />
              This adjustment is immutable. The reason and note appear in the user's ledger and the workspace audit log.
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong">Cancel</button>
              <button
                onClick={submit}
                disabled={submitting || !note.trim() || amount === 0}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? "Recording…" : "Record adjustment"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
