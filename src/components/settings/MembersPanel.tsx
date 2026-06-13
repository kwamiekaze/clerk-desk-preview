import { useEffect, useState } from "react";
import { Mail, Trash2, Send } from "lucide-react";
import { settingsApi, type Invite, type Role, type WorkspaceMember } from "@/lib/mock/settings";
import { SettingsCard, Field, TextInput, SelectInput } from "./_atoms";
import { timeAgo } from "@/lib/format";

const ROLES: Role[] = ["Owner", "Admin", "Member", "Viewer"];

export function MembersPanel() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Member");
  const [sending, setSending] = useState(false);
  const [draftLimit, setDraftLimit] = useState<Record<string, string>>({});

  useEffect(() => {
    settingsApi.getMembers().then(({ members, invites }) => { setMembers(members); setInvites(invites); });
  }, []);

  async function send() {
    if (!email) return;
    setSending(true);
    const inv = await settingsApi.invite(email, role);
    setInvites((i) => [inv, ...i]);
    setEmail("");
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Invite a teammate" description="Roles control bureau permissions; member CP limits are enforced server-side.">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <Field label="Email"><TextInput type="email" placeholder="name@studio.dev" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Role">
            <SelectInput value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.filter((r) => r !== "Owner").map((r) => <option key={r}>{r}</option>)}
            </SelectInput>
          </Field>
          <div className="flex items-end">
            <button
              onClick={send}
              disabled={sending || !email}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              Send invite
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Members" description="Active workspace members and their monthly point limits.">
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 sm:flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{m.name}</span>
                  <span className="rounded border border-border bg-background px-1.5 font-mono text-[10px] uppercase tracking-wider text-mute">{m.role}</span>
                </div>
                <div className="font-mono text-[11px] text-mute">{m.email} · last active {timeAgo(m.lastActiveAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <SelectInput
                  value={m.role}
                  disabled={m.role === "Owner"}
                  onChange={(e) => settingsApi.setRole(m.id, e.target.value as Role)}
                  className="w-28"
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </SelectInput>
                <input
                  type="number"
                  min={0}
                  placeholder={m.monthlyPointLimit?.toString() ?? "no cap"}
                  value={draftLimit[m.id] ?? ""}
                  onChange={(e) => setDraftLimit({ ...draftLimit, [m.id]: e.target.value })}
                  onBlur={(e) => settingsApi.setMemberPointLimit(m.id, e.target.value === "" ? null : parseInt(e.target.value, 10))}
                  className="w-24 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
                  aria-label={`${m.name} CP limit`}
                />
                <button className="rounded-md border border-border p-1.5 text-mute hover:text-destructive" aria-label="Remove">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="Pending invites">
        {invites.length === 0 ? (
          <p className="text-sm text-mute">No outstanding invites.</p>
        ) : (
          <ul className="divide-y divide-border">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-mute" />
                  <div>
                    <div className="text-sm">{inv.email} <span className="text-mute">· {inv.role}</span></div>
                    <div className="font-mono text-[11px] text-mute">invited {timeAgo(inv.invitedAt)} by {inv.invitedBy}</div>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  inv.status === "pending" ? "border-status-warn/40 bg-status-warn/10 text-status-warn" : "border-border text-mute"
                }`}>{inv.status}</span>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>
    </div>
  );
}
