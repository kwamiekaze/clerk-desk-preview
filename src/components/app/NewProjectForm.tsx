import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ModelRouter } from "./ModelRouter";
import { mockApi } from "@/lib/mock/service";
import type { ModelTier, NewProjectInput } from "@/lib/mock/types";
import { Loader2, Sparkles, Globe2, FileText } from "lucide-react";

export function NewProjectForm() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<NewProjectInput["kind"]>("brief");
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [url, setUrl] = useState("");
  const [model, setModel] = useState<ModelTier>("recommended");
  const [budget, setBudget] = useState(3);
  const [loading, setLoading] = useState(false);

  const estimate = useMemo(
    () => mockApi.estimate({ kind, model, budget }),
    [kind, model, budget],
  );

  const valid =
    name.trim().length > 1 &&
    (kind === "brief" ? brief.trim().length > 8 : /^https?:\/\/.+\..+/.test(url));

  // Auto-name from URL/brief if empty
  useEffect(() => {
    if (name) return;
    if (kind === "clone" && url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        setName(host.split(".")[0]);
      } catch {
        /* noop */
      }
    }
  }, [url, kind, name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    const res = await mockApi.createProject({
      name: name.trim(),
      kind,
      brief: brief.trim() || undefined,
      url: url.trim() || undefined,
      model,
      maxBudget: budget,
    });
    navigate({ to: "/app/projects/$id", params: { id: res.id }, search: { init: 1 } });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Left column */}
      <div className="space-y-6">
        {/* Tabs */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div role="tablist" aria-label="Project source" className="flex border-b border-border">
            {(["brief", "clone"] as const).map((k) => {
              const active = kind === k;
              const Icon = k === "brief" ? FileText : Globe2;
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setKind(k)}
                  className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-sm transition-colors ${
                    active ? "text-foreground" : "text-mute hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  {k === "brief" ? "Product brief" : "Clone URL"}
                  {active && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-t bg-primary" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-4 p-5">
            <Field label="Project name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aurora pricing page"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </Field>

            {kind === "brief" ? (
              <Field
                label="Product brief"
                hint="What should the clerks build? Be specific about intent, scope, and tone."
              >
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={6}
                  placeholder="Three pricing tiers for a Postgres analytics tool, monthly/annual toggle, dark editorial theme…"
                  className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                />
              </Field>
            ) : (
              <Field label="Reference URL" hint="Public pages only. Firecrawl captures structure + tokens.">
                <div className="flex items-center rounded-md border border-border bg-background focus-within:border-primary">
                  <span className="px-3 font-mono text-[11px] text-mute">https://</span>
                  <input
                    value={url.replace(/^https?:\/\//, "")}
                    onChange={(e) => setUrl("https://" + e.target.value.replace(/^https?:\/\//, ""))}
                    placeholder="stripe.com/payments"
                    className="w-full bg-transparent py-2.5 pr-3 text-sm focus:outline-none"
                  />
                </div>
              </Field>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              {["React", "Tailwind", "TypeScript", kind === "clone" ? "Firecrawl" : "Sandbox"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[10px] text-mute"
                >
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <ModelRouter value={model} onChange={setModel} />
        </div>

        <Field label="Maximum budget (CP)" hint="Hard cap. Clerks pause when reached and ask before continuing.">
          <div className="flex items-center gap-4 rounded-md border border-border bg-surface p-4">
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-surface-2 accent-[oklch(var(--primary))]"
              style={{ accentColor: "var(--primary)" }}
            />
            <div className="w-24 text-right font-mono text-sm">
              <span className="text-foreground">{budget.toFixed(1)}</span>
              <span className="text-mute"> CP</span>
            </div>
          </div>
        </Field>
      </div>

      {/* Right column — summary */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-border-strong bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              Dispatch summary
            </div>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>

          <dl className="mt-4 divide-y divide-border">
            <Row k="Source" v={kind === "brief" ? "Written brief" : "URL clone"} />
            <Row k="Model" v={model.charAt(0).toUpperCase() + model.slice(1)} />
            <Row
              k="Estimated CP"
              v={
                <span className="font-mono">
                  {estimate.min.toFixed(1)}–{estimate.max.toFixed(1)}
                </span>
              }
            />
            <Row k="Budget cap" v={<span className="font-mono">{budget.toFixed(1)} CP</span>} />
            <Row k="ETA" v={<span className="font-mono">~{estimate.etaSec}s</span>} />
          </dl>

          <button
            type="submit"
            disabled={!valid || loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Dispatch to clerks
            <span className="font-mono text-[11px] opacity-70">↵</span>
          </button>
          <p className="mt-3 text-center font-mono text-[10px] text-mute">
            You can pause or cancel from the project page at any time.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-border p-4 font-mono text-[11px] text-mute">
          <div className="text-foreground">Tip</div>
          <p className="mt-1.5">
            Briefs with explicit intent (audience, tone, must-have sections) consistently cost{" "}
            <span className="text-primary">~30% fewer CP</span> than vague ones.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{label}</div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-mute">{hint}</p>}
    </label>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <dt className="text-mute">{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}
