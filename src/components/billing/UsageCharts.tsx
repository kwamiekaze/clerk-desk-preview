import { useEffect, useState } from "react";
import { billingApi, type UsageBucket, type UsageGroupBy } from "@/lib/mock/billing";

const TABS: Array<{ id: UsageGroupBy; label: string }> = [
  { id: "project", label: "By project" },
  { id: "member", label: "By member" },
  { id: "modelRoute", label: "By model route" },
  { id: "taskType", label: "By task type" },
];

export function UsageCharts() {
  const [group, setGroup] = useState<UsageGroupBy>("project");
  const [data, setData] = useState<UsageBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    billingApi.getUsage(group).then((d) => { setData(d); setLoading(false); });
  }, [group]);

  const max = Math.max(1, ...data.map((d) => d.points));
  const total = data.reduce((s, d) => s + d.points, 0);

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setGroup(t.id)}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              group === t.id
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border text-mute hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto font-mono text-[11px] text-mute">
          Total · <span className="text-foreground">{total} CP</span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="font-mono text-xs text-mute">Loading…</div>
        ) : data.length === 0 ? (
          <div className="py-6 text-center text-sm text-mute">No usage yet.</div>
        ) : (
          <ul className="space-y-2.5">
            {data.map((d) => (
              <li key={d.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-3 capitalize">{d.label}</span>
                  <span className="font-mono text-[12px] text-mute">{d.points} CP</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${(d.points / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
