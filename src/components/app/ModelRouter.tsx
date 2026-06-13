import type { ModelTier } from "@/lib/mock/types";
import { Zap, Star, Crown, Wand2 } from "lucide-react";

const TIERS: Array<{
  id: ModelTier;
  name: string;
  icon: typeof Zap;
  blurb: string;
  cost: string;
}> = [
  { id: "automatic", name: "Automatic", icon: Wand2, blurb: "Let the bureau pick per task.", cost: "1.0×" },
  { id: "fast", name: "Fast", icon: Zap, blurb: "Cheap, quick drafts. Best for previews.", cost: "0.6×" },
  { id: "recommended", name: "Recommended", icon: Star, blurb: "Balanced quality, the default choice.", cost: "1.15×" },
  { id: "premium", name: "Premium", icon: Crown, blurb: "Top-shelf models for the toughest desks.", cost: "1.8×" },
];

export function ModelRouter({
  value,
  onChange,
}: {
  value: ModelTier;
  onChange: (v: ModelTier) => void;
}) {
  return (
    <fieldset>
      <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
        Model routing
      </legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => {
          const active = value === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`relative rounded-lg border p-3 text-left transition-colors ${
                active
                  ? "border-primary/60 bg-primary/5"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-mute"}`} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-mute">{t.cost}</span>
              </div>
              <div className="mt-2 text-sm font-medium tracking-tight">{t.name}</div>
              <div className="mt-1 text-xs text-mute">{t.blurb}</div>
              {active && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
