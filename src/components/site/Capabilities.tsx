const ITEMS = [
  {
    k: "01",
    title: "Multi-clerk authoring",
    body: "Specialized agents share a desk — intake, design, engineering, QA — coordinated through a transparent task ledger.",
  },
  {
    k: "02",
    title: "Firecrawl ingestion",
    body: "Drop any public URL. Routes, copy, palette, and component patterns are captured and converted into structured tokens.",
  },
  {
    k: "03",
    title: "Isolated sandboxes",
    body: "Every build runs in an ephemeral, networked container with deterministic dependencies and zero cross-tenant access.",
  },
  {
    k: "04",
    title: "Live preview",
    body: "A hot-reloading URL is provisioned within seconds. Share it with stakeholders before a single commit lands.",
  },
  {
    k: "05",
    title: "GitHub export",
    body: "One click writes a clean, conventional-commit branch to your repository — fully readable, no obfuscated bundles.",
  },
  {
    k: "06",
    title: "Vercel deployment",
    body: "Promote previews to production with a single dispatch. Environment, domains, and analytics wired automatically.",
  },
] as const;

export function Capabilities() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {ITEMS.map((it) => (
        <article
          key={it.k}
          className="group relative bg-surface p-6 transition-colors hover:bg-surface-2"
        >
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              {it.k}
            </span>
            <span
              aria-hidden
              className="h-1.5 w-1.5 translate-y-1 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-primary"
            />
          </div>
          <h3 className="mt-6 text-lg font-medium tracking-tight">{it.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-mute">{it.body}</p>
        </article>
      ))}
    </div>
  );
}
