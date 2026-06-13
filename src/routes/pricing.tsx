import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Section } from "@/components/site/Section";
import { PlanCard } from "@/components/billing/PlanCard";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { CadenceToggle } from "@/components/billing/CadenceToggle";
import { BillingFAQ } from "@/components/billing/BillingFAQ";
import { PLANS, TOPUPS, type Cadence } from "@/lib/mock/billing";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — CodingClerks" },
      { name: "description", content: "Transparent Coding Points pricing. Free, Starter, Builder, and Pro tiers with predictable per-task receipts." },
      { property: "og:title", content: "CodingClerks pricing" },
      { property: "og:description", content: "Pay for what the bureau actually does — every charge itemized in Coding Points." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [cadence, setCadence] = useState<Cadence>("monthly");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <Section id="pricing" eyebrow="Pricing" title="One ledger currency. No surprises.">
        <div className="flex flex-col items-center gap-4">
          <p className="max-w-2xl text-center text-mute">
            Every plan grants Coding Points (CP). Spend them on agents, crawls, sandboxes, and deploys —
            with an estimate before generation and an itemized receipt after.
          </p>
          <CadenceToggle value={cadence} onChange={setCadence} />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              cadence={cadence}
              onSelect={() => (window.location.href = "/auth?mode=signup&plan=" + p.id)}
            />
          ))}
        </div>

        <div className="mt-12">
          <h3 className="mb-3 text-base font-medium tracking-tight">Compare every line</h3>
          <PlanComparison cadence={cadence} />
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Top-ups</div>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">Need more CP this month?</h3>
              <p className="mt-1 text-sm text-mute">Purchased CP never expires and is spent last.</p>
            </div>
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {TOPUPS.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-background/60 p-4">
                <div className="text-2xl font-semibold tracking-tight">{t.points} CP</div>
                <div className="mt-1 font-mono text-[12px] text-mute">${t.priceUsd.toFixed(2)} one-time · ${(t.priceUsd / t.points).toFixed(3)}/CP</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="mb-3 text-base font-medium tracking-tight">Common questions</h3>
          <BillingFAQ />
        </div>

        <div className="mt-12 flex items-center justify-center gap-3">
          <Link to="/auth" className="rounded-md border border-border px-4 py-2.5 text-sm hover:border-border-strong">Sign in</Link>
          <Link to="/auth" className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Open the desk</Link>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
