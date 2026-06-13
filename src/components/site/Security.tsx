const POINTS = [
  {
    title: "You own the code",
    body: "Every artifact is plain, readable React. Exported under your GitHub account, under your license, with no runtime tether to CodingClerks.",
  },
  {
    title: "Isolated execution",
    body: "Each build runs in an ephemeral sandbox with no cross-tenant filesystem or network. Workspaces are destroyed on completion.",
  },
  {
    title: "Auditable provenance",
    body: "The ledger records every clerk action with timestamps and inputs. Export the trail for compliance or peer review.",
  },
  {
    title: "Encrypted secrets",
    body: "Environment values are encrypted at rest with per-project keys. Clerks see redacted handles, never raw values.",
  },
];

export function Security() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <div>
        <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
              ownership.lock
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-cc-pulse-dot" />
              sealed
            </span>
          </div>
          <pre className="mt-4 overflow-x-auto font-mono text-[12px] leading-relaxed text-foreground/90">
{`{
  "owner":     "you@yourdomain.com",
  "license":   "MIT",
  "framework": "react@19",
  "exports": {
    "github":  "yourorg/your-repo",
    "vercel":  "yourorg/your-project"
  },
  "vendor_lockin": false,
  "provenance": "ledger://build-7f3a"
}`}
          </pre>
        </div>
      </div>

      <div className="space-y-6">
        {POINTS.map((p) => (
          <div key={p.title} className="border-l border-primary/40 pl-5">
            <h3 className="text-base font-medium tracking-tight text-foreground">{p.title}</h3>
            <p className="mt-1.5 text-sm text-mute">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
