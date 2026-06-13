export function PointsTeaser() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 bloom-primary opacity-60" aria-hidden />

      <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            Coding Points · CP
          </div>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One ledger currency.<br />
            Every clerk, every build.
          </h3>
          <p className="mt-4 max-w-md text-mute">
            CP is the transparent unit of work across the bureau. Simple agent calls cost a few points;
            full crawls and deployments cost more. No opaque token math, no surprise bills.
          </p>
          <div className="mt-6 flex items-baseline gap-3 font-mono text-sm text-mute">
            <span className="text-3xl font-semibold text-foreground">1 CP</span>
            <span>≈ one specialist micro-task</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
            Sample dispatch
          </div>
          <ul className="mt-4 divide-y divide-border">
            {[
              ["Intake clerk · parse brief", "2 CP"],
              ["Firecrawl · 14 routes", "6 CP"],
              ["Designer · lift tokens", "3 CP"],
              ["Engineer · scaffold + wire", "5 CP"],
              ["QA · type + a11y pass", "2 CP"],
            ].map(([label, cost]) => (
              <li key={label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground/90">{label}</span>
                <span className="font-mono text-mute">{cost}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-mono text-sm">
            <span className="uppercase tracking-[0.18em] text-mute">Total</span>
            <span className="text-primary">18 CP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
