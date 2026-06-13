const TILES = [
  { tag: "Landing", title: "Marketing surface", note: "scroll-linked headers, restrained motion" },
  { tag: "Docs", title: "Editorial documentation", note: "search, MDX, callouts" },
  { tag: "Microsite", title: "Animated launch site", note: "GSAP-grade timelines, lazy media" },
  { tag: "Dashboard", title: "Operator interface", note: "tables, charts, command-K" },
];

export function WebsiteShowcase() {
  return (
    <div>
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => (
          <div key={t.tag} className="group relative overflow-hidden bg-surface">
            <div className="aspect-[5/4] w-full">
              <div className="relative h-full w-full bg-background">
                <div className="absolute inset-0 bg-grid-fine opacity-50" aria-hidden />
                <div className="absolute inset-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                    <span className="ml-2 h-1 w-16 rounded bg-foreground/20" />
                  </div>
                  <div className="mt-3 h-3 w-2/3 rounded bg-foreground/80" />
                  <div className="h-2 w-1/2 rounded bg-foreground/30" />
                  <div className="mt-auto grid grid-cols-3 gap-1.5">
                    <div className="h-8 rounded bg-foreground/10" />
                    <div className="h-8 rounded bg-secondary/40" />
                    <div className="h-8 rounded bg-primary/60" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  {t.tag}
                </div>
                <div className="mt-0.5 text-sm font-medium">{t.title}</div>
              </div>
              <div className="text-right font-mono text-[10px] text-mute">{t.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 rounded-xl border border-border bg-surface p-6 sm:grid-cols-3">
        {[
          { k: "Animated", v: "Choreographed scroll, parallax, view-transitions — disabled gracefully under reduced motion." },
          { k: "Interactive", v: "Forms, command palettes, theming, real-time previews wired with sensible defaults." },
          { k: "Specialized", v: "Pattern libraries for marketing, docs, app shells, e-commerce, and event launches." },
        ].map((b) => (
          <div key={b.k}>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{b.k}</div>
            <p className="mt-2 text-sm text-foreground/90">{b.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
