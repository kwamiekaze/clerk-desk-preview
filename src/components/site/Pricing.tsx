const TIERS = [
  {
    name: "Apprentice",
    price: "Free",
    cadence: "to start",
    cp: "200 CP / month",
    features: ["1 active desk", "Public previews", "GitHub export", "Community ledger"],
    cta: "Open the desk",
    featured: false,
  },
  {
    name: "Bureau",
    price: "$29",
    cadence: "per seat / month",
    cp: "3,000 CP / month included",
    features: ["Unlimited desks", "Private sandboxes", "Vercel deployment", "Priority clerks"],
    cta: "Start the bureau",
    featured: true,
  },
  {
    name: "Atelier",
    price: "Custom",
    cadence: "annual",
    cp: "Bring-your-own model keys",
    features: ["SAML SSO", "Self-host clerks", "Dedicated runtime", "Signed provenance"],
    cta: "Talk to us",
    featured: false,
  },
];

export function Pricing() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {TIERS.map((t) => (
        <div
          key={t.name}
          className={`relative rounded-2xl border bg-surface p-6 ${
            t.featured ? "border-primary/50 ring-bloom" : "border-border"
          }`}
        >
          {t.featured && (
            <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full border border-primary/50 bg-background px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              Recommended
            </span>
          )}
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">{t.name}</div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight">{t.price}</span>
            <span className="text-sm text-mute">{t.cadence}</span>
          </div>
          <div className="mt-2 font-mono text-[11px] text-primary">{t.cp}</div>

          <ul className="mt-6 space-y-2.5">
            {t.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <svg
                  className="mt-1 h-3 w-3 text-primary"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M2 6.5L5 9.5L10 3" strokeLinecap="square" />
                </svg>
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>

          <a
            href="#cta"
            className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${
              t.featured
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border text-foreground hover:border-border-strong"
            }`}
          >
            {t.cta}
            <span className="font-mono text-[11px] opacity-70">→</span>
          </a>
        </div>
      ))}
    </div>
  );
}
