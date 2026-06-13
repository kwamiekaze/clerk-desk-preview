import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, ExternalLink, RefreshCw, Trash2, X } from "lucide-react";
import { PROVIDER_DOCS, settingsApi, type CredentialStatus, type ProviderId } from "@/lib/mock/settings";
import { SettingsCard, Field, TextInput } from "./_atoms";

export function CredentialsPanel() {
  const [rows, setRows] = useState<CredentialStatus[]>([]);
  const [active, setActive] = useState<CredentialStatus | null>(null);

  useEffect(() => { settingsApi.getCredentials().then(setRows); }, []);

  function update(c: CredentialStatus) { setRows((r) => r.map((x) => (x.provider === c.provider ? c : x))); }

  return (
    <>
      <SettingsCard
        title="Provider credentials"
        description="Server-side vault. Saved secrets never round-trip back to your browser — you'll only see status."
      >
        <ul className="divide-y divide-border">
          {rows.map((c) => <CredentialRow key={c.provider} cred={c} onReplace={() => setActive(c)} onVerify={async () => update(await settingsApi.verifyCredential(c.provider))} onRevoke={async () => update(await settingsApi.revokeCredential(c.provider))} />)}
        </ul>
      </SettingsCard>

      <ReplaceDialog
        open={!!active}
        cred={active}
        onClose={() => setActive(null)}
        onSaved={(c) => { update(c); setActive(null); }}
      />
    </>
  );
}

function CredentialRow({
  cred,
  onReplace,
  onVerify,
  onRevoke,
}: {
  cred: CredentialStatus;
  onReplace: () => void;
  onVerify: () => void;
  onRevoke: () => void;
}) {
  const connected = cred.status !== "not_connected";
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
          <KeyRound className="h-4 w-4 text-mute" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            {cred.label}
            <StatusBadge status={cred.status} />
          </div>
          <p className="mt-0.5 text-xs text-mute">{cred.blurb}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mute">
            {cred.lastVerifiedAt ? <span>last verified {new Date(cred.lastVerifiedAt).toLocaleString()}</span> : <span>never verified</span>}
            {cred.scope && <span>scope · {cred.scope}</span>}
            <a className="inline-flex items-center gap-1 text-foreground/80 hover:text-primary" href={PROVIDER_DOCS[cred.provider]} target="_blank" rel="noreferrer">
              get key <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {!connected ? (
          <button onClick={onReplace} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Connect</button>
        ) : (
          <>
            <button onClick={onVerify} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-border-strong">
              <RefreshCw className="h-3 w-3" /> Verify
            </button>
            <button onClick={onReplace} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:border-border-strong">
              Replace
            </button>
            <button onClick={onRevoke} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3 w-3" /> Revoke
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: CredentialStatus["status"] }) {
  const map = {
    not_connected:   { dot: "bg-mute", border: "border-border", text: "text-mute", label: "Not connected" },
    connected:       { dot: "bg-status-ok", border: "border-status-ok/40", text: "text-status-ok", label: "Connected" },
    needs_attention: { dot: "bg-status-warn", border: "border-status-warn/40", text: "text-status-warn", label: "Needs attention" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${map.border} bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${map.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${map.dot}`} />
      {map.label}
    </span>
  );
}

function ReplaceDialog({
  open, cred, onClose, onSaved,
}: {
  open: boolean; cred: CredentialStatus | null; onClose: () => void; onSaved: (c: CredentialStatus) => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  if (!open || !cred) return null;

  async function save() {
    setSaving(true);
    const next = await settingsApi.saveCredential(cred!.provider, value);
    setValue("");
    setSaving(false);
    onSaved(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 sm:rounded-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-background hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">{cred.status === "not_connected" ? "Connect" : "Replace"}</div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">{cred.label} key</h3>
        <p className="mt-1 text-sm text-mute">{cred.blurb}</p>

        <div className="mt-4">
          <Field label="API key" hint="Paste your secret. We hash and store it server-side; it will not be displayed again.">
            <TextInput type="password" autoFocus placeholder="sk-…" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-border/60 bg-background/40 p-3 text-xs text-mute">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-primary" />
          Submitted over TLS to <code className="font-mono">POST /api/settings/credentials/{cred.provider}</code>. The raw value never returns to the browser.
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong">Cancel</button>
          <button
            onClick={save}
            disabled={!value || saving}
            className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save & verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
