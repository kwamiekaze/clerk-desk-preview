import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    eyebrow: "Try the bureau",
    cp: "5 daily Coding Points · 30 / month cap",
    features: ["Private projects", "Core building experience", "Daily reset at midnight UTC", "Community support"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Starter",
    price: "$4.99",
    cadence: "per month",
    eyebrow: "Entry plan",
    cp: "20 monthly CP + 5 daily (cap 30)",
    features: ["Everything in Free", "Code view", "Remove CodingClerks badge", "Rollover for 1 cycle"],
    cta: "Choose Starter",
    featured: false,
  },
  {
    name: "Builder",
    price: "$9.99",
    cadence: "per month",
    eyebrow: "Recommended",
    cp: "40 monthly CP + 5 daily (cap 60)",
    features: ["Everything in Starter", "Custom domains", "GitHub export", "Vercel deployment"],
    cta: "Choose Builder",
    featured: true,
  },
  {
    name: "Pro",
    price: "$14.99",
    cadence: "per month",
    eyebrow: "Best quality",
    cp: "60 monthly CP + 5 daily (cap 90)",
    features: ["Everything in Builder", "Premium model routing", "Longer generation context", "Priority sandbox queue"],
    cta: "Choose Pro",
    featured: false,
  },
];

export function Pricing() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TIERS.map((t) => (
        <div
          key={t.name}
          className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${
            t.featured ? "border-primary/50 ring-bloom" : "border-border"
          }`}
        >
          {t.featured && (
            <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full border border-primary/50 bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              {t.eyebrow}
            </span>
          )}
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">{t.name}</div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight">{t.price}</span>
            <span className="text-sm text-mute">{t.cadence}</span>
          </div>
          <div className="mt-2 font-mono text-[11px] text-primary">{t.cp}</div>

          <ul className="mt-5 flex-1 space-y-2.5">
            {t.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>

          <a
            href="/auth"
            className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${
              t.featured
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border text-foreground hover:border-border-strong"
            }`}
          >
            {t.cta}
          </a>
        </div>
      ))}
    </div>
  );
}
