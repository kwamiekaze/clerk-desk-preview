import { useEffect, useState } from "react";
import { settingsApi, type WorkspaceSettings } from "@/lib/mock/settings";
import { SettingsCard, Field, TextInput, SelectInput } from "./_atoms";

export function WorkspacePanel() {
  const [w, setW] = useState<WorkspaceSettings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { settingsApi.getWorkspace().then(setW); }, []);
  if (!w) return <div className="font-mono text-xs text-mute">Loading…</div>;

  return (
    <SettingsCard
      title="Workspace identity"
      description="Visible across the bureau. Slug controls your URL and invite links."
      footer={
        <button
          disabled={saving}
          onClick={async () => { setSaving(true); await settingsApi.updateWorkspace(w); setSaving(false); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Workspace name"><TextInput value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} /></Field>
        <Field label="URL slug" hint={`https://codingclerks.dev/${w.slug}`}>
          <TextInput value={w.slug} onChange={(e) => setW({ ...w, slug: e.target.value.replace(/[^a-z0-9-]/g, "") })} />
        </Field>
        <Field label="Default region">
          <SelectInput value={w.defaultRegion} onChange={(e) => setW({ ...w, defaultRegion: e.target.value as WorkspaceSettings["defaultRegion"] })}>
            <option value="us-east">US East (Virginia)</option>
            <option value="us-west">US West (Oregon)</option>
            <option value="eu-west">EU West (Ireland)</option>
            <option value="ap-southeast">Asia Pacific (Singapore)</option>
          </SelectInput>
        </Field>
        <Field label="Default sandbox">
          <SelectInput value={w.defaultSandbox} onChange={(e) => setW({ ...w, defaultSandbox: e.target.value as WorkspaceSettings["defaultSandbox"] })}>
            <option value="e2b">E2B</option>
            <option value="vercel-sandbox">Vercel Sandbox</option>
          </SelectInput>
        </Field>
      </div>
      <p className="mt-4 font-mono text-[11px] text-mute">Created {new Date(w.createdAt).toLocaleDateString()}.</p>
    </SettingsCard>
  );
}
