import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BalancePanel } from "@/components/billing/BalancePanel";
import { SubscriptionPanel } from "@/components/billing/SubscriptionPanel";
import { PlanCard } from "@/components/billing/PlanCard";
import { CadenceToggle } from "@/components/billing/CadenceToggle";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { TopUpDialog } from "@/components/billing/TopUpDialog";
import { LowBalanceBanner } from "@/components/billing/LowBalanceBanner";
import { BillingFAQ } from "@/components/billing/BillingFAQ";
import {
  billingApi,
  PLANS,
  type Cadence,
  type Plan,
  type PointBalance,
  type SubscriptionStatus,
} from "@/lib/mock/billing";

export const Route = createFileRoute("/app/billing/")({
  head: () => ({ meta: [{ title: "Billing — CodingClerks" }] }),
  component: BillingOverview,
});

function BillingOverview() {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [bal, setBal] = useState<PointBalance | null>(null);
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [planDialog, setPlanDialog] = useState<Plan | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);

  useEffect(() => {
    billingApi.getSubscription().then(setSub);
    billingApi.getBalance().then(setBal);
  }, []);

  if (!sub || !bal) {
    return <div className="font-mono text-xs text-mute">Loading billing…</div>;
  }

  return (
    <div className="space-y-6">
      <LowBalanceBanner available={bal.total} onTopUp={() => setTopupOpen(true)} />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <BalancePanel balance={bal} onTopUp={() => setTopupOpen(true)} />
        <SubscriptionPanel sub={sub} onChange={setSub} />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-medium tracking-tight">Change plan</h2>
            <p className="text-xs text-mute">Pick a new tier — we&apos;ll prorate and redirect to secure checkout.</p>
          </div>
          <CadenceToggle value={cadence} onChange={setCadence} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              cadence={cadence}
              current={p.id === sub.planId}
              onSelect={(plan) => setPlanDialog(plan)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-medium tracking-tight">How CP works</h2>
        <BillingFAQ />
      </section>

      <UpgradeDialog
        open={!!planDialog}
        plan={planDialog}
        cadence={cadence}
        currentPlanId={sub.planId}
        onClose={() => setPlanDialog(null)}
      />
      <TopUpDialog open={topupOpen} onClose={() => setTopupOpen(false)} />
    </div>
  );
}
