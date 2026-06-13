import { useState } from "react";

type Mode = "prompt" | "url";

const PROMPT_PLACEHOLDER =
  "A pricing page for a Postgres analytics product. Three tiers, monthly/annual toggle, dark theme.";
const URL_PLACEHOLDER = "https://stripe.com/payments";

export function PromptBuilder() {
  const [mode, setMode] = useState<Mode>("prompt");
  const [value, setValue] = useState("");

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl"
        style={{
          background:
            "linear-gradient(140deg, color-mix(in oklab, var(--primary) 35%, transparent), transparent 40%, color-mix(in oklab, var(--secondary) 35%, transparent))",
        }}
        aria-hidden
      />
      <div className="relative rounded-2xl border border-border-strong bg-surface/80 backdrop-blur-xl">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-[11px] text-mute">
            <span className="h-1.5 w-1.5 rounded-full bg-status-ok" />
            desk-01 · /new-brief
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
            {(["prompt", "url"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-mute hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-4">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
            {mode === "prompt" ? "Brief" : "Reference URL"}
          </label>
          {mode === "prompt" ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={PROMPT_PLACEHOLDER}
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-mute/70 focus:border-primary focus:outline-none"
            />
          ) : (
            <div className="mt-2 flex items-center rounded-md border border-border bg-background focus-within:border-primary">
              <span className="px-3 font-mono text-[11px] text-mute">https://</span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={URL_PLACEHOLDER.replace("https://", "")}
                className="w-full bg-transparent py-3 pr-3 text-sm text-foreground placeholder:text-mute/70 focus:outline-none"
              />
            </div>
          )}

          {/* Tag chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["React", "Tailwind", "TypeScript", mode === "url" ? "Firecrawl" : "Sandbox"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] text-mute"
              >
                <span className="h-1 w-1 rounded-full bg-primary" />
                {t}
              </span>
            ))}
          </div>

          {/* Action row */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-3 font-mono text-[11px] text-mute">
              <span>~ 18 CP</span>
              <span className="h-3 w-px bg-border" />
              <span>est. 12s</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Dispatch to clerks
              <span className="font-mono text-[11px] opacity-70">↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
