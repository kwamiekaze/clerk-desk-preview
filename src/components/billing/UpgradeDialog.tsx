import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { billingApi, planPrice, type Cadence, type Plan, type PlanId } from "@/lib/mock/billing";

export function UpgradeDialog({
  open,
  plan,
  cadence,
  currentPlanId,
  onClose,
}: {
  open: boolean;
  plan: Plan | null;
  cadence: Cadence;
  currentPlanId: PlanId;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  if (!open || !plan) return null;
  const isDowngrade =
    ["free", "starter", "builder", "pro"].indexOf(plan.id) <
    ["free", "starter", "builder", "pro"].indexOf(currentPlanId);

  async function confirm() {
    if (!plan) return;
    setRedirecting(true);
    // SERVER CONTRACT: POST /api/billing/checkout -> { url }; browser does window.location = url.
    const session = await billingApi.startCheckout(plan.id, cadence);
    navigate({ to: "/checkout/$session", params: { session: session.id } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 sm:rounded-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-background hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
          {isDowngrade ? "Change plan" : "Upgrade"}
        </div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">
          {isDowngrade ? "Downgrade to" : "Upgrade to"} {plan.name}
        </h3>

        <div className="mt-4 rounded-md border border-border bg-background/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-mute text-sm">New rate</span>
            <span className="text-2xl font-semibold tracking-tight">
              {planPrice(plan, cadence) === 0 ? "Free" : `$${planPrice(plan, cadence).toFixed(2)}`}
              <span className="ml-1 text-xs text-mute">/ {cadence === "annual" ? "mo, yearly" : "month"}</span>
            </span>
          </div>
          <div className="mt-2 font-mono text-[11px] text-mute">
            {plan.monthlyPoints} CP/mo · {plan.dailyPoints} CP/day (cap {plan.dailyCap}/mo)
          </div>
        </div>

        {isDowngrade ? (
          <p className="mt-4 text-sm text-mute">
            Your current plan stays active until the end of the period. Unused rollover CP keeps its expiry.
          </p>
        ) : (
          <p className="mt-4 text-sm text-mute">
            We&apos;ll prorate the difference and grant the new CP allotment immediately on confirmation.
          </p>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-md border border-border/60 bg-background/40 p-3 text-xs text-mute">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-primary" />
          Checkout is processed on Stripe&apos;s secure page. No card data ever touches CodingClerks.
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
            {redirecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Continue <ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
