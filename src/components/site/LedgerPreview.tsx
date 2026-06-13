const LEDGER = [
  { t: "00:00", clerk: "intake", msg: "Brief parsed · 7 components inferred", status: "ok" },
  { t: "00:02", clerk: "crawler", msg: "Firecrawl · 14 routes captured", status: "ok" },
  { t: "00:04", clerk: "designer", msg: "Tokens lifted · palette resolved", status: "ok" },
  { t: "00:06", clerk: "engineer", msg: "Scaffolding React + Vite", status: "run" },
  { t: "00:09", clerk: "engineer", msg: "Wiring routes · /pricing, /docs", status: "run" },
  { t: "00:11", clerk: "qa", msg: "Type-check pass · 0 errors", status: "ok" },
  { t: "00:12", clerk: "preview", msg: "Sandbox live · 127.0.0.1:5173", status: "ok" },
] as const;

const dotColor = {
  ok: "bg-status-ok",
  run: "bg-status-run",
  warn: "bg-status-warn",
  idle: "bg-status-idle",
} as const;

export function LedgerPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Ledger */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl border border-border-strong bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
              Clerk activity ledger
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-status-ok animate-cc-pulse-dot" />
              streaming
            </div>
          </div>
          <ol className="divide-y divide-border">
            {LEDGER.map((row, i) => (
              <li key={i} className="grid grid-cols-[56px_92px_1fr_auto] items-center gap-3 px-4 py-2.5">
                <span className="font-mono text-[11px] text-mute">{row.t}</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor[row.status]}`} />
                  {row.clerk}
                </span>
                <span className="truncate text-sm text-foreground/90">{row.msg}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
                  {row.status}
                </span>
              </li>
            ))}
          </ol>
          <div className="border-t border-border bg-background/40 px-4 py-2.5 font-mono text-[11px] text-mute">
            <span className="text-primary">▍</span> awaiting next dispatch
            <span className="ml-0.5 inline-block animate-cc-blink">_</span>
          </div>
        </div>
      </div>

      {/* Live preview illustration */}
      <div className="lg:col-span-3">
        <div className="relative overflow-hidden rounded-xl border border-border-strong bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
              <span className="h-2 w-2 rounded-full bg-primary/70" />
            </div>
            <div className="rounded border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-mute">
              preview.codingclerks.dev/build-7f3a
            </div>
            <div className="font-mono text-[11px] text-mute">120ms</div>
          </div>

          <div className="relative aspect-[16/10] overflow-hidden bg-background">
            <div className="absolute inset-0 bg-grid-fine opacity-60" aria-hidden />
            <div className="pointer-events-none absolute inset-0 bloom-secondary opacity-40" aria-hidden />

            {/* fake app chrome */}
            <div className="absolute inset-6 grid grid-cols-12 grid-rows-6 gap-3">
              <div className="col-span-3 row-span-6 rounded-md border border-border bg-surface/80 p-3">
                <div className="h-3 w-16 rounded bg-foreground/70" />
                <div className="mt-3 space-y-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-2 w-full rounded bg-foreground/10" />
                  ))}
                </div>
                <div className="mt-4 h-2 w-12 rounded bg-primary/70" />
                <div className="mt-2 space-y-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-2 w-full rounded bg-foreground/10" />
                  ))}
                </div>
              </div>
              <div className="col-span-9 row-span-2 rounded-md border border-border bg-surface/80 p-3">
                <div className="h-3 w-40 rounded bg-foreground/80" />
                <div className="mt-2 h-2 w-64 rounded bg-foreground/20" />
                <div className="mt-3 flex gap-2">
                  <div className="h-6 w-20 rounded bg-primary" />
                  <div className="h-6 w-20 rounded border border-border" />
                </div>
              </div>
              <div className="col-span-3 row-span-4 rounded-md border border-border bg-surface/80 p-3">
                <div className="h-2 w-12 rounded bg-foreground/40" />
                <div className="mt-3 h-16 rounded bg-foreground/10" />
                <div className="mt-3 h-2 w-3/4 rounded bg-foreground/20" />
              </div>
              <div className="col-span-3 row-span-4 rounded-md border border-border bg-surface/80 p-3">
                <div className="h-2 w-12 rounded bg-foreground/40" />
                <div className="mt-3 h-16 rounded bg-secondary/40" />
                <div className="mt-3 h-2 w-3/4 rounded bg-foreground/20" />
              </div>
              <div className="col-span-3 row-span-4 rounded-md border border-border bg-surface/80 p-3">
                <div className="h-2 w-12 rounded bg-foreground/40" />
                <div className="mt-3 h-16 rounded bg-primary/30" />
                <div className="mt-3 h-2 w-3/4 rounded bg-foreground/20" />
              </div>
            </div>

            {/* scanning line */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-cc-scan"
              style={{
                background:
                  "linear-gradient(180deg, transparent, color-mix(in oklab, var(--primary) 18%, transparent), transparent)",
              }}
              aria-hidden
            />
          </div>

          <div className="flex items-center justify-between border-t border-border bg-background/40 px-4 py-2 font-mono text-[11px] text-mute">
            <span>build · 7f3a · main</span>
            <span className="text-primary">● live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
