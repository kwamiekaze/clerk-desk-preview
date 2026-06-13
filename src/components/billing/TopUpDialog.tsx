import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Loader2, Zap } from "lucide-react";
import { TOPUPS, billingApi, type TopUp } from "@/lib/mock/billing";

export function TopUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TopUp["id"]>("tu_50");
  const [redirecting, setRedirecting] = useState(false);
  if (!open) return null;

  async function confirm() {
    setRedirecting(true);
    const session = await billingApi.startTopup(selected);
    navigate({ to: "/checkout/$session", params: { session: session.id } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 sm:rounded-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-background hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Top up</div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">Add Coding Points</h3>
        <p className="mt-1 text-sm text-mute">Purchased CP never expire and are spent last.</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {TOPUPS.map((t) => {
            const active = selected === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id)}
                className={`relative rounded-lg border p-4 text-left ${active ? "border-primary/60 bg-primary/5" : "border-border bg-background/40 hover:border-border-strong"}`}
              >
                {t.recommended && (
                  <span className="absolute right-2 top-2 rounded-full border border-primary/40 bg-background px-1.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                    best
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight">
                  <Zap className="h-4 w-4 text-primary" />
                  {t.points} CP
                </div>
                <div className="mt-1 font-mono text-[12px] text-mute">${t.priceUsd.toFixed(2)} one-time</div>
                <div className="mt-2 font-mono text-[10px] text-mute">${(t.priceUsd / t.points).toFixed(3)}/CP</div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:border-border-strong">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={redirecting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {redirecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Continue to checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
