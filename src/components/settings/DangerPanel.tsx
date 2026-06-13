import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { settingsApi } from "@/lib/mock/settings";
import { SettingsCard, Field, TextInput } from "./_atoms";

export function DangerPanel() {
  const [confirm, setConfirm] = useState("");
  const [job, setJob] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function destroy() {
    setSubmitting(true);
    const r = await settingsApi.deleteWorkspace(confirm);
    setJob(r.jobId);
    setSubmitting(false);
  }

  return (
    <SettingsCard title="Danger zone" description="Irreversible workspace operations.">
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="flex-1">
            <h3 className="text-sm font-medium">Delete workspace</h3>
            <p className="mt-1 text-xs text-mute">
              Schedules a 30-day deletion job. Projects, ledger entries, members, and credentials are
              purged. Purchased CP is refunded to the original payment method. Active subscriptions are
              cancelled immediately.
            </p>
            <div className="mt-4">
              <Field label='Type "DELETE" to confirm'>
                <TextInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
              </Field>
            </div>
            <button
              disabled={confirm !== "DELETE" || submitting}
              onClick={destroy}
              className="mt-4 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {submitting ? "Scheduling…" : "Schedule deletion"}
            </button>
            {job && <p className="mt-3 font-mono text-[11px] text-destructive">Job {job} scheduled — irreversible after 30 days.</p>}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
