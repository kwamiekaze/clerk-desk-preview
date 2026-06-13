export function PointsTeaser() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-50" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 bloom-primary opacity-60" aria-hidden />

      <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            Coding Points
          </div>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Small, friendly numbers.<br />
            One charge per completed task.
          </h3>
          <p className="mt-4 max-w-md text-mute">
            Coding Points reflect the actual work a clerk completed — not raw tokens. You see an
            estimated range before a build and the final fractional charge after.
          </p>
          <div className="mt-6 flex items-baseline gap-3 font-mono text-sm text-mute">
            <span className="text-3xl font-semibold text-foreground">0.5 CP</span>
            <span>≈ a quick edit · fractional in 0.1 steps</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
            Typical charges
          </div>
          <ul className="mt-4 divide-y divide-border">
            {[
              ["Change a button color or text", "~0.5 CP"],
              ["Remove or modify a section", "0.5–0.9 CP"],
              ["Add auth or a focused feature", "1.0–1.5 CP"],
              ["Landing page with full theme", "2.0–3.0 CP"],
              ["Animated marketing website", "3.0–6.0 CP"],
              ["Multi-page SaaS shell", "5.0–12 CP"],
            ].map(([label, cost]) => (
              <li key={label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground/90">{label}</span>
                <span className="font-mono text-mute">{cost}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3 font-mono text-[11px] text-mute">
            Estimates only. Failed provider calls cost 0 CP.
          </div>
        </div>
      </div>
    </div>
  );
}
