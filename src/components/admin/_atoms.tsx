import { type ReactNode } from "react";

export function StatCard({
  label, value, delta, hint, icon,
}: {
  label: string; value: ReactNode; delta?: string; hint?: string; icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {(delta || hint) && <div className="mt-0.5 font-mono text-[11px] text-mute">{delta ?? hint}</div>}
    </div>
  );
}

export function BarRow({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = Math.max(2, Math.round((value / Math.max(1, max)) * 100));
  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="truncate pr-3 capitalize">{label}</span>
        <span className="font-mono text-[12px] text-mute">{value.toLocaleString()}{suffix ?? ""}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary/80" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
