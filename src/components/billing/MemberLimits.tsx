import { useEffect, useState } from "react";
import { billingApi, type Member } from "@/lib/mock/billing";

export function MemberLimits() {
  const [rows, setRows] = useState<Member[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { billingApi.getMembers().then(setRows); }, []);

  async function save(id: string) {
    const v = draft[id];
    const limit = v === "" || v == null ? null : Math.max(0, parseInt(v, 10) || 0);
    setSaving(id);
    await billingApi.setMemberLimit(id, limit);
    setRows((r) => r.map((m) => (m.id === id ? { ...m, monthlyLimit: limit } : m)));
    setSaving(null);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="border-b border-border p-4">
        <h3 className="text-base font-medium tracking-tight">Workspace member limits</h3>
        <p className="mt-1 text-xs text-mute">
          Cap how many Coding Points each member can spend per calendar month. Leave blank for no cap.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((m) => {
          const cap = m.monthlyLimit ?? Infinity;
          const pct = Math.min(100, Math.round((m.usedThisMonth / (Number.isFinite(cap) ? cap : Math.max(m.usedThisMonth, 1))) * 100));
          const over = Number.isFinite(cap) && m.usedThisMonth >= cap;
          return (
            <li key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 sm:flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{m.name}</span>
                  <span className="rounded border border-border bg-background px-1.5 font-mono text-[10px] uppercase tracking-wider text-mute">
                    {m.role}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-mute">{m.email}</div>
                <div className="mt-2 h-1.5 max-w-md overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 font-mono text-[10px] text-mute">
                  {m.usedThisMonth} used · cap {m.monthlyLimit ?? "none"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder={m.monthlyLimit?.toString() ?? "none"}
                  value={draft[m.id] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [m.id]: e.target.value })}
                  className="w-28 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary/50 focus:outline-none"
                />
                <button
                  onClick={() => save(m.id)}
                  disabled={saving === m.id || m.role === "Owner"}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-border-strong disabled:opacity-60"
                >
                  {saving === m.id ? "Saving…" : "Save"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
