import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { adminApi, type AdminUser } from "@/lib/mock/admin";
import { Section } from "./_atoms";
import { AdjustPointsDialog } from "./AdjustPointsDialog";
import { ImpersonateDialog } from "./ImpersonateDialog";

export function UsersTable() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [adjustUser, setAdjustUser] = useState<AdminUser | null>(null);
  const [imperUser, setImperUser] = useState<AdminUser | null>(null);

  useEffect(() => { adminApi.listUsers().then(setRows); }, []);
  const visible = q ? rows.filter((r) => (r.name + r.email + r.workspaceName).toLowerCase().includes(q.toLowerCase())) : rows;

  return (
    <Section
      title="Users & workspaces"
      action={
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-mute" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search users, workspaces…"
            className="w-56 bg-transparent text-sm placeholder:text-mute/70 focus:outline-none"
          />
        </div>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border">
              {["User", "Workspace", "Plan", "Available CP", "Used · 30d", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="font-mono text-[11px] text-mute">{u.email}</div>
                </td>
                <td className="px-4 py-3">{u.workspaceName}</td>
                <td className="px-4 py-3 capitalize"><span className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">{u.planId}</span></td>
                <td className="px-4 py-3 font-mono">{u.pointsAvailable}</td>
                <td className="px-4 py-3 font-mono text-mute">{u.pointsUsed30d}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    u.status === "active" ? "border-status-ok/40 bg-status-ok/10 text-status-ok"
                    : u.status === "trialing" ? "border-status-warn/40 bg-status-warn/10 text-status-warn"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => setAdjustUser(u)} className="rounded-md border border-border px-2 py-1 text-xs hover:border-border-strong">Adjust CP</button>
                    <button onClick={() => setImperUser(u)} className="rounded-md border border-border px-2 py-1 text-xs text-mute hover:text-foreground">Impersonate…</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdjustPointsDialog open={!!adjustUser} user={adjustUser} onClose={() => setAdjustUser(null)} />
      <ImpersonateDialog open={!!imperUser} user={imperUser} onClose={() => setImperUser(null)} />
    </Section>
  );
}
