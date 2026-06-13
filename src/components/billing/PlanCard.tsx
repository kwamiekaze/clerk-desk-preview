import { Check } from "lucide-react";
import type { Cadence, Plan } from "@/lib/mock/billing";
import { planPrice } from "@/lib/mock/billing";

export function PlanCard({
  plan,
  cadence,
  current,
  onSelect,
}: {
  plan: Plan;
  cadence: Cadence;
  current?: boolean;
  onSelect?: (plan: Plan) => void;
}) {
  const price = planPrice(plan, cadence);
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${
        plan.highlight ? "border-primary/50 ring-bloom" : "border-border"
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full border border-primary/50 bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
          Recommended
        </span>
      )}
      {current && (
        <span className="absolute -top-2.5 right-6 inline-flex items-center gap-1 rounded-full border border-border-strong bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mute">
          Current
        </span>
      )}

      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">{plan.name}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">
          {price === 0 ? "Free" : `$${price.toFixed(2)}`}
        </span>
        {price !== 0 && (
          <span className="text-sm text-mute">/ {cadence === "annual" ? "mo, billed yearly" : "month"}</span>
        )}
      </div>
      <p className="mt-2 text-sm text-mute">{plan.blurb}</p>

      <div className="mt-4 rounded-md border border-border bg-background/60 p-3 font-mono text-[11px]">
        <div className="flex items-center justify-between text-foreground">
          <span>Monthly CP</span>
          <span className="text-primary">{plan.monthlyPoints}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-mute">
          <span>Daily CP</span>
          <span>{plan.dailyPoints} / day (cap {plan.dailyCap}/mo)</span>
        </div>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect?.(plan)}
        disabled={current}
        className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${
          current
            ? "border border-border text-mute cursor-default"
            : plan.highlight
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-border text-foreground hover:border-border-strong"
        }`}
      >
        {current ? "Current plan" : plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
      </button>
    </div>
  );
}
