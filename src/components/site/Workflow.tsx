const STEPS = [
  {
    n: "01",
    label: "Intake",
    title: "A brief or a URL",
    body: "Submit a written brief or a reference link. The intake clerk normalizes scope, intent, and constraints into a task slate.",
  },
  {
    n: "02",
    label: "Survey",
    title: "Crawl and lift",
    body: "Firecrawl gathers structure and content. The design clerk lifts a token system: palette, type, spacing, motion.",
  },
  {
    n: "03",
    label: "Draft",
    title: "Sandboxed build",
    body: "Engineering clerks scaffold React components inside an isolated workspace, streaming progress to the ledger.",
  },
  {
    n: "04",
    label: "Review",
    title: "Live preview & QA",
    body: "A shareable preview spins up alongside automated type and accessibility checks. You comment in line, agents respond.",
  },
  {
    n: "05",
    label: "Ship",
    title: "GitHub & Vercel",
    body: "Approve to export a clean branch and promote to a production Vercel deployment. Provenance preserved end to end.",
  },
];

export function Workflow() {
  return (
    <ol className="relative grid gap-6 lg:grid-cols-5">
      <div
        className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px lg:block"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 35%, transparent), transparent)",
        }}
        aria-hidden
      />
      {STEPS.map((s, i) => (
        <li key={s.n} className="relative">
          <div className="flex items-center gap-3 lg:block">
            <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-background font-mono text-sm text-primary">
              {s.n}
            </span>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute lg:mt-4">
              {s.label}
            </div>
          </div>
          <h3 className="mt-3 text-lg font-medium tracking-tight">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">{s.body}</p>
          {i < STEPS.length - 1 && (
            <div className="mt-4 h-px w-12 bg-border lg:hidden" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}
