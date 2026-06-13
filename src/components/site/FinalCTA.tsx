export function FinalCTA() {
  return (
    <section id="cta" className="relative overflow-hidden border-t border-border">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-[420px] max-w-3xl bloom-primary opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-[320px] w-[320px] bloom-secondary opacity-50" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[11px] text-mute backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-status-ok animate-cc-pulse-dot" />
          Bureau open · seats available
        </div>
        <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Hand the build to a desk that <span className="text-primary">never goes home.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-mute">
          Bring a prompt, a URL, or a Friday-night idea. Your CodingClerks will draft, preview, and ship —
          on the ledger, in your repo, under your name.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open the desk
            <span className="font-mono text-[11px] opacity-70">↵</span>
          </a>
          <a
            href="#workflow"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm text-foreground transition-colors hover:border-border-strong"
          >
            Tour the workflow
          </a>
        </div>
        <div className="mt-6 font-mono text-[11px] text-mute">
          No credit card · 200 CP on the house · Cancel from any session
        </div>
      </div>
    </section>
  );
}
