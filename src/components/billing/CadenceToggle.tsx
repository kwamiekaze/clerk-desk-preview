import type { Cadence } from "@/lib/mock/billing";

export function CadenceToggle({ value, onChange }: { value: Cadence; onChange: (v: Cadence) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
      {(["monthly", "annual"] as const).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            value === c ? "bg-primary text-primary-foreground" : "text-mute hover:text-foreground"
          }`}
        >
          {c === "annual" ? "Annual" : "Monthly"}
          {c === "annual" && (
            <span className={`ml-1.5 rounded-full px-1.5 font-mono text-[9px] uppercase tracking-wider ${
              value === c ? "bg-background/20 text-primary-foreground" : "bg-primary/10 text-primary"
            }`}>
              −20%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
