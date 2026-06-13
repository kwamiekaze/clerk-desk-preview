import { useEffect, useState } from "react";
import { settingsApi, type Profile } from "@/lib/mock/settings";
import { SettingsCard, Field, TextInput, SelectInput, Toggle } from "./_atoms";

export function ProfilePanel() {
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { settingsApi.getProfile().then(setP); }, []);
  if (!p) return <div className="font-mono text-xs text-mute">Loading…</div>;

  return (
    <SettingsCard
      title="Profile"
      description="How clerks address you and which inbox receives notifications."
      footer={
        <button
          onClick={async () => { setSaving(true); await settingsApi.updateProfile(p); setSaving(false); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      }
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background font-mono text-lg">
          {p.initials}
        </div>
        <div>
          <button className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-border-strong">Upload avatar</button>
          <p className="mt-1 text-[11px] text-mute">PNG or JPG, max 2 MB.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><TextInput value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
        <Field label="Email" hint="Verified via magic link."><TextInput type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></Field>
        <Field label="Pronouns"><TextInput value={p.pronouns ?? ""} onChange={(e) => setP({ ...p, pronouns: e.target.value })} /></Field>
        <Field label="Timezone">
          <SelectInput value={p.timezone} onChange={(e) => setP({ ...p, timezone: e.target.value })}>
            {["America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Tokyo"].map((tz) => (
              <option key={tz}>{tz}</option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <Toggle
          checked={p.twoFactorEnabled}
          onChange={(v) => setP({ ...p, twoFactorEnabled: v })}
          label="Two-factor authentication"
          description="Use an authenticator app on sign-in. Recovery codes are shown once."
        />
      </div>
    </SettingsCard>
  );
}
