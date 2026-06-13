import { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import { adminApi, type AdminUser, type ImpersonationRequest } from "@/lib/mock/admin";

export function ImpersonateDialog({ open, user, onClose }: { open: boolean; user: AdminUser | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [req, setReq] = useState<ImpersonationRequest | null>(null);

  if (!open || !user) return null;

  async function submit() {
    setSubmitting(true);
    const r = await adminApi.requestImpersonation({ targetUserId: user!.id, targetEmail: user!.email, reason });
    setReq(r);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 sm:rounded-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-background hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Support · impersonation request</div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">{user.name}</h3>
        <p className="mt-1 font-mono text-[11px] text-mute">{user.email}</p>

        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 text-destructive" />
            <div>
              <div className="font-medium text-foreground">No session is issued client-side.</div>
              <p className="mt-1 text-mute">
                The server creates a request the target must approve in their own console. Every action you take
                while impersonating is recorded in the immutable audit log and visible to the user.
              </p>
            </div>
          </div>
        </div>

        {req ? (
          <div className="mt-4 rounded-md border border-status-ok/40 bg-status-ok/5 p-4 text-sm">
            <div>Request <span className="font-mono">{req.id}</span> sent.</div>
            <p className="mt-1 text-xs text-mute">Status: {req.status.replace(/_/g, " ")}. Expires {new Date(req.expiresAt).toLocaleString()}.</p>
            <button onClick={onClose} className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Done</button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Reason (required)</span>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ticket #, scope of investigation…"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-primary" />
                <span>I have a support ticket and confirm the user has been notified out-of-band.</span>
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong">Cancel</button>
              <button
                onClick={submit}
                disabled={!ack || !reason.trim() || submitting}
                className="flex-1 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Request approval"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
