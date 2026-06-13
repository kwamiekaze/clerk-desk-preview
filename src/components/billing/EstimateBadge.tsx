import { Gauge } from "lucide-react";

/** Estimated range badge — shown before generation. Server is authoritative. */
export function EstimateBadge({
  min,
  max,
  budget,
  finalCharge,
}: {
  min: number;
  max: number;
  budget?: number;
  finalCharge?: number | null;
}) {
  const overBudget = budget != null && max > budget;
  return (
    <div className="inline-flex flex-col gap-1 rounded-md border border-border bg-surface px-3 py-2 font-mono text-[11px]">
      <div className="flex items-center gap-2 text-mute">
        <Gauge className="h-3 w-3" />
        <span className="uppercase tracking-[0.18em]">{finalCharge != null ? "Charged" : "Estimate"}</span>
      </div>
      {finalCharge != null ? (
        <div className="text-foreground">
          <span className="text-lg font-semibold tracking-tight">{finalCharge}</span>
          <span className="ml-1 text-mute">CP final</span>
        </div>
      ) : (
        <div className="text-foreground">
          <span className="text-lg font-semibold tracking-tight">{min}–{max}</span>
          <span className="ml-1 text-mute">CP</span>
          {budget != null && (
            <span className={`ml-2 ${overBudget ? "text-destructive" : "text-mute"}`}>
              · budget {budget}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
