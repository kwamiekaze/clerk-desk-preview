import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { settingsApi, type ProviderId, type RoutingPrefs } from "@/lib/mock/settings";
import type { ModelTier } from "@/lib/mock/types";
import { SettingsCard, Field, SelectInput, Toggle } from "./_atoms";

const PROVIDER_LABELS: Record<ProviderId, string> = {
  openrouter: "OpenRouter", openai: "OpenAI", anthropic: "Anthropic",
  firecrawl: "Firecrawl",   vercel: "Vercel", e2b: "E2B", github: "GitHub",
};

export function RoutingPanel() {
  const [r, setR] = useState<RoutingPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { settingsApi.getRouting().then(setR); }, []);
  if (!r) return <div className="font-mono text-xs text-mute">Loading…</div>;

  function move(i: number, dir: -1 | 1) {
    const next = [...r!.preferProviders];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setR({ ...r!, preferProviders: next });
  }

  return (
    <SettingsCard
      title="Model routing"
      description="Defaults applied to every new run. Project- and run-level overrides win."
      footer={
        <button
          disabled={saving}
          onClick={async () => { setSaving(true); await settingsApi.updateRouting(r); setSaving(false); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Default tier">
          <SelectInput value={r.defaultTier} onChange={(e) => setR({ ...r, defaultTier: e.target.value as ModelTier })}>
            <option value="automatic">Automatic — bureau decides</option>
            <option value="fast">Fast — drafts (0.6×)</option>
            <option value="recommended">Recommended — balanced (1.15×)</option>
            <option value="premium">Premium — best (1.8×)</option>
          </SelectInput>
        </Field>
        <Field label="Hard budget per run (CP)" hint="A run is rejected before dispatch if it would exceed this cap.">
          <input
            type="number" min={5} max={500} value={r.hardBudgetPerRun}
            onChange={(e) => setR({ ...r, hardBudgetPerRun: Math.max(5, parseInt(e.target.value, 10) || 5) })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <Toggle
          checked={r.allowAutoUpgrade}
          onChange={(v) => setR({ ...r, allowAutoUpgrade: v })}
          label="Allow auto-upgrade for hard tasks"
          description="When confidence is low, the router may escalate one tier within the budget."
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Preferred providers</div>
        <p className="mb-3 text-xs text-mute">Drag to reorder. Routing honors order when multiple providers can serve a route.</p>
        <ul className="space-y-1.5">
          {r.preferProviders.map((p, i) => (
            <li key={p} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <GripVertical className="h-3.5 w-3.5 text-mute" />
                <span className="font-mono text-[11px] text-mute">{i + 1}.</span>
                {PROVIDER_LABELS[p]}
              </span>
              <span className="flex gap-1">
                <button onClick={() => move(i, -1)} className="rounded border border-border px-1.5 text-xs text-mute hover:text-foreground">↑</button>
                <button onClick={() => move(i, 1)} className="rounded border border-border px-1.5 text-xs text-mute hover:text-foreground">↓</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SettingsCard>
  );
}
