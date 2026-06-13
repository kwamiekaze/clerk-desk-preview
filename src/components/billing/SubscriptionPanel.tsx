import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { billingApi, planById, type SubscriptionStatus } from "@/lib/mock/billing";

export function SubscriptionPanel({
  sub,
  onChange,
}: {
  sub: SubscriptionStatus;
  onChange: (s: SubscriptionStatus) => void;
}) {
  const plan = planById(sub.planId);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  async function openPortal() {
    setPortalLoading(true);
    // SERVER CONTRACT: POST /api/billing/portal -> { url }
    const s = await billingApi.openCustomerPortal();
    window.location.href = s.url;
  }

  async function toggleCancel() {
    setCancelLoading(true);
    const next = sub.cancelAtPeriodEnd ? await billingApi.resumeSubscription() : await billingApi.cancelSubscription();
    onChange(next);
    setCancelLoading(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">Subscription</div>
          <div className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight">
            {plan.name}
            <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mute">
              {sub.cadence}
            </span>
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
              sub.status === "active"
                ? "border-status-ok/40 bg-status-ok/10 text-status-ok"
                : "border-status-warn/40 bg-status-warn/10 text-status-warn"
            }`}>
              {sub.status}
            </span>
          </div>
          <div className="mt-2 font-mono text-[11px] text-mute">
            {sub.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
            <span className="text-foreground/90">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong disabled:opacity-60"
          >
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            Customer portal
          </button>
          <button
            onClick={toggleCancel}
            disabled={cancelLoading}
            className="rounded-md border border-border px-3 py-2 text-sm text-mute hover:text-foreground disabled:opacity-60"
          >
            {cancelLoading ? "Saving…" : sub.cancelAtPeriodEnd ? "Resume subscription" : "Cancel at period end"}
          </button>
        </div>
      </div>

      {sub.cancelAtPeriodEnd && (
        <div className="mt-4 rounded-md border border-status-warn/40 bg-status-warn/5 p-3 text-xs text-foreground/90">
          Your plan will end on {new Date(sub.currentPeriodEnd).toLocaleDateString()}. You&apos;ll keep all access
          until then. Purchased CP remains usable; rollover and monthly CP expire on their existing schedule.
        </div>
      )}
    </div>
  );
}
