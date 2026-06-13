import { useEffect, useState } from "react";
import { Power } from "lucide-react";
import { adminApi, type RoutePolicy } from "@/lib/mock/admin";
import type { ModelTier } from "@/lib/mock/types";
import { Section } from "./_atoms";

const TIERS: ModelTier[] = ["automatic", "fast", "recommended", "premium"];

export function RoutePolicyEditor() {
  const [p, setP] = useState<RoutePolicy | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { adminApi.getRoutePolicy().then(setP); }, []);
  if (!p) return <div className="font-mono text-xs text-mute">Loading…</div>;

  function update(patch: Partial<RoutePolicy>) { setP({ ...p!, ...patch }); }

  return (
    <Section
      title="Route policy"
      action={
        <button
          disabled={saving}
          onClick={async () => { setSaving(true); await adminApi.updateRoutePolicy(p); setSaving(false); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save policy"}
        </button>
      }
    >
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Weights & budgets</div>
            <div className="mt-3 space-y-2.5">
              {TIERS.map((t) => (
                <div key={t} className="grid grid-cols-[80px_1fr_auto] items-center gap-2">
                  <span className="text-sm capitalize">{t}</span>
                  <input
                    type="range" min={0.2} max={3} step={0.05}
                    value={p.weights[t]}
                    onChange={(e) => update({ weights: { ...p.weights, [t]: +e.target.value } })}
                    className="w-full accent-primary"
                  />
                  <span className="w-28 font-mono text-[11px] text-mute text-right">
                    {p.weights[t].toFixed(2)}× · cap{" "}
                    <input
                      type="number" min={5} max={200}
                      value={p.perRouteBudgetCp[t]}
                      onChange={(e) => update({ perRouteBudgetCp: { ...p.perRouteBudgetCp, [t]: parseInt(e.target.value, 10) || 0 } })}
                      className="w-14 rounded border border-border bg-background px-1 text-right text-foreground"
                    /> CP
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Fallback order</div>
            <ol className="mt-3 space-y-1.5">
              {p.fallbackOrder.map((t, i) => (
                <li key={t} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm capitalize">
                  <span><span className="mr-2 font-mono text-[11px] text-mute">{i + 1}.</span>{t}</span>
                  <span className="flex gap-1">
                    <button
                      onClick={() => {
                        const arr = [...p.fallbackOrder];
                        if (i === 0) return;
                        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                        update({ fallbackOrder: arr });
                      }}
                      className="rounded border border-border px-1.5 text-xs text-mute hover:text-foreground">↑</button>
                    <button
                      onClick={() => {
                        const arr = [...p.fallbackOrder];
                        if (i === arr.length - 1) return;
                        [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                        update({ fallbackOrder: arr });
                      }}
                      className="rounded border border-border px-1.5 text-xs text-mute hover:text-foreground">↓</button>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Provider kill switches</div>
            <ul className="mt-3 space-y-1.5">
              {p.killSwitches.map((k, idx) => (
                <li key={k.provider} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <span className="capitalize">{k.provider}</span>
                  <button
                    onClick={() => update({ killSwitches: p.killSwitches.map((x, i) => i === idx ? { ...x, disabled: !x.disabled } : x) })}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                      k.disabled ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-status-ok/40 bg-status-ok/10 text-status-ok"
                    }`}
                  >
                    <Power className="h-3 w-3" />
                    {k.disabled ? "disabled" : "live"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-5 font-mono text-[11px] text-mute">
          Policy edits are server-authoritative and propagate to every clerk within ~30s. All changes append to the audit log.
        </p>
      </div>
    </Section>
  );
}
