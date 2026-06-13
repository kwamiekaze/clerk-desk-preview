import { useEffect, useState } from "react";
import { adminApi, type AuditEntry } from "@/lib/mock/admin";
import { Section } from "./_atoms";

export function AuditLog() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { adminApi.getAudit().then(setRows); }, []);
  const visible = q ? rows.filter((r) => (r.actor + r.action + r.target).toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <Section
      title="Audit log"
      action={
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Filter actor / action / target"
          className="w-64 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm placeholder:text-mute/60 focus:outline-none"
        />
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border">
              {["When", "Actor", "Action", "Target", "IP", "Meta"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0 align-top">
                <td className="px-4 py-3 font-mono text-[11px] text-mute">{new Date(r.at).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-[12px]">{r.actor}</td>
                <td className="px-4 py-3">{r.action}</td>
                <td className="px-4 py-3 font-mono text-[12px]">{r.target}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-mute">{r.ip}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-mute">
                  {r.meta ? Object.entries(r.meta).map(([k, v]) => `${k}=${v}`).join(" · ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[11px] text-mute">Append-only · backed by an immutable server-side table. Exports are signed.</p>
    </Section>
  );
}
