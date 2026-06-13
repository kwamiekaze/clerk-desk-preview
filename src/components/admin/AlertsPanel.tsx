import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { adminApi, type AbuseAlert } from "@/lib/mock/admin";
import { Section } from "./_atoms";
import { timeAgo } from "@/lib/format";

const SEV = {
  high:   "border-destructive/40 bg-destructive/10 text-destructive",
  medium: "border-status-warn/40 bg-status-warn/10 text-status-warn",
  low:    "border-border text-mute",
} as const;

export function AlertsPanel() {
  const [rows, setRows] = useState<AbuseAlert[]>([]);
  useEffect(() => { adminApi.getAlerts().then(setRows); }, []);

  return (
    <Section title="Abuse & anomaly alerts">
      <ul className="space-y-2">
        {rows.map((a) => (
          <li key={a.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`mt-0.5 h-4 w-4 ${a.severity === "high" ? "text-destructive" : a.severity === "medium" ? "text-status-warn" : "text-mute"}`} />
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${SEV[a.severity]}`}>{a.severity}</span>
                  <span className="font-medium capitalize">{a.kind.replace(/_/g, " ")}</span>
                </div>
                <div className="mt-0.5 text-sm text-foreground/90">{a.subject}</div>
                <div className="mt-0.5 text-xs text-mute">{a.detail}</div>
                <div className="mt-1 font-mono text-[11px] text-mute">{timeAgo(a.at)}</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => { adminApi.acknowledgeAlert(a.id); setRows((r) => r.map((x) => x.id === a.id ? { ...x, acknowledged: true } : x)); }}
                disabled={a.acknowledged}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-border-strong disabled:opacity-60"
              >
                {a.acknowledged ? "Acknowledged" : "Acknowledge"}
              </button>
              <button className="rounded-md border border-border px-2.5 py-1.5 text-xs text-mute hover:text-foreground">Investigate</button>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
