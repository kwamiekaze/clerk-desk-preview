import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { settingsApi, type PrivacyPrefs } from "@/lib/mock/settings";
import { SettingsCard, Field, Toggle } from "./_atoms";

export function PrivacyPanel() {
  const [p, setP] = useState<PrivacyPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportJob, setExportJob] = useState<string | null>(null);

  useEffect(() => { settingsApi.getPrivacy().then(setP); }, []);
  if (!p) return <div className="font-mono text-xs text-mute">Loading…</div>;

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Data retention"
        description="How long the bureau holds your project artifacts and clerk logs."
        footer={
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); await settingsApi.updatePrivacy(p); setSaving(false); }}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Projects" hint="Source, history, and previews.">
            <input type="range" min={30} max={730} step={30} value={p.retainProjectsDays} onChange={(e) => setP({ ...p, retainProjectsDays: +e.target.value })} className="w-full accent-primary" />
            <div className="mt-1 font-mono text-[11px] text-mute">{p.retainProjectsDays} days</div>
          </Field>
          <Field label="Clerk logs" hint="Tool calls, prompts, and outputs.">
            <input type="range" min={7} max={365} step={7} value={p.retainLogsDays} onChange={(e) => setP({ ...p, retainLogsDays: +e.target.value })} className="w-full accent-primary" />
            <div className="mt-1 font-mono text-[11px] text-mute">{p.retainLogsDays} days</div>
          </Field>
        </div>

        <div className="mt-4 border-t border-border pt-2">
          <Toggle checked={p.allowModelTraining} onChange={(v) => setP({ ...p, allowModelTraining: v })} label="Allow CodingClerks to use my prompts for model improvement" description="Off by default. Never includes secrets or PII." />
          <Toggle checked={p.allowAnonymousMetrics} onChange={(v) => setP({ ...p, allowAnonymousMetrics: v })} label="Send anonymous performance metrics" description="Helps us tune routing weights." />
          <Toggle checked={p.scrubPII} onChange={(v) => setP({ ...p, scrubPII: v })} label="Scrub PII from logs" description="Mask emails, tokens, and addresses before persistence." />
        </div>
      </SettingsCard>

      <SettingsCard title="Export my data" description="Receive a tarball of projects, ledger, and audit log via signed link.">
        <button
          onClick={async () => { const r = await settingsApi.requestExport(); setExportJob(r.jobId); }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong"
        >
          <Download className="h-3.5 w-3.5" /> Request export
        </button>
        {exportJob && <p className="mt-3 font-mono text-[11px] text-mute">Job {exportJob} queued. You'll get an email when ready.</p>}
      </SettingsCard>
    </div>
  );
}
