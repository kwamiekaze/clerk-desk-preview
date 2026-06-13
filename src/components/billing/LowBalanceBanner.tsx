import { AlertTriangle, Zap } from "lucide-react";

export function LowBalanceBanner({
  available,
  threshold = 10,
  onTopUp,
}: {
  available: number;
  threshold?: number;
  onTopUp: () => void;
}) {
  if (available > threshold) return null;
  const insufficient = available <= 0;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        insufficient
          ? "border-destructive/50 bg-destructive/5"
          : "border-status-warn/50 bg-status-warn/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 h-4 w-4 ${insufficient ? "text-destructive" : "text-status-warn"}`} />
        <div>
          <div className="text-sm font-medium tracking-tight">
            {insufficient ? "Insufficient Coding Points" : "Running low on Coding Points"}
          </div>
          <p className="mt-0.5 text-xs text-mute">
            {insufficient
              ? "New generations are paused until you top up or upgrade. In-flight work won't be charged on provider failures."
              : `You have ${available} CP left. Top up to keep the clerks dispatching without interruption.`}
          </p>
        </div>
      </div>
      <button
        onClick={onTopUp}
        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Zap className="h-3.5 w-3.5" /> Top up
      </button>
    </div>
  );
}
