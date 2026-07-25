import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Loader2, Save, Check, X, KeyRound } from "lucide-react";
import {
  getKeyStatuses,
  saveProviderKey,
  removeProviderKey,
  setDefaultProvider,
  testProviderKey,
  type KeyStatus,
} from "@/lib/ai/keys.functions";

type Provider = KeyStatus["provider"];

type Data = {
  statuses: KeyStatus[];
  defaultProvider: Provider | null;
  platformFallbackAvailable: boolean;
};

export function ProviderKeysPanel() {
  const load = useServerFn(getKeyStatuses);
  const save = useServerFn(saveProviderKey);
  const remove = useServerFn(removeProviderKey);
  const setDef = useServerFn(setDefaultProvider);
  const test = useServerFn(testProviderKey);

  const [state, setState] = useState<Data | null>(null);

  async function refresh() {
    setState((await load()) as Data);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  if (!state) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-md">
        <Loader2 className="h-4 w-4 animate-spin text-mute" />
      </section>
    );
  }

  const connected = state.statuses.filter((s) => s.connected);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-primary">AI Provider Keys</h2>
      </div>
      <p className="mt-2 text-xs text-mute">
        Bring your own key. Stored securely; never shown again. Users on their own key are not subject to free-plan build caps.
      </p>

      {connected.length === 0 && !state.platformFallbackAvailable && (
        <div className="mt-4 rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-primary">
          Add an API key below to start building.
        </div>
      )}

      {connected.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="font-mono text-[10px] uppercase text-mute">Default provider</div>
          <select
            value={state.defaultProvider ?? ""}
            onChange={async (e) => {
              const p = e.target.value as Provider;
              if (!p) return;
              await setDef({ data: { provider: p } });
              refresh();
            }}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary/60"
          >
            {!state.defaultProvider && <option value="">— select —</option>}
            {connected.map((s) => (
              <option key={s.provider} value={s.provider}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-5 grid gap-3">
        {state.statuses.map((s) => (
          <ProviderCard
            key={s.provider}
            status={s}
            isDefault={state.defaultProvider === s.provider}
            onSave={async (apiKey, model) => { await save({ data: { provider: s.provider, apiKey, model: model || undefined } }); await refresh(); }}
            onRemove={async () => { await remove({ data: { provider: s.provider } }); await refresh(); }}
            onTest={async () => await test({ data: { provider: s.provider } })}
          />
        ))}
      </div>
    </section>
  );
}

function ProviderCard({
  status,
  isDefault,
  onSave,
  onRemove,
  onTest,
}: {
  status: KeyStatus;
  isDefault: boolean;
  onSave: (apiKey: string, model: string) => Promise<void>;
  onRemove: () => Promise<void>;
  onTest: () => Promise<{ ok: boolean; message: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [modelInput, setModelInput] = useState(status.model ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => { setModelInput(status.model ?? ""); }, [status.model]);

  async function save() {
    if (!keyInput.trim()) return;
    setBusy(true); setErr(null);
    try {
      await onSave(keyInput.trim(), modelInput.trim());
      setKeyInput("");
      setEditing(false);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function runTest() {
    setTesting(true); setTestResult(null);
    try { setTestResult(await onTest()); }
    finally { setTesting(false); }
  }

  async function remove() {
    if (!confirm(`Remove your ${status.label} key?`)) return;
    await onRemove();
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{status.label}</span>
          {status.connected ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
              <Check className="h-3 w-3" /> Connected
            </span>
          ) : (
            <span className="rounded-md border border-border px-2 py-0.5 font-mono text-[10px] text-mute">Not connected</span>
          )}
          {isDefault && (
            <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">Default</span>
          )}
        </div>
        {status.connected && !editing && (
          <div className="flex items-center gap-1">
            <button onClick={runTest} disabled={testing}
              className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-mute hover:text-primary hover:border-primary/60">
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
            </button>
            <button onClick={() => setEditing(true)} className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-mute hover:text-foreground">Replace</button>
            <button onClick={remove} className="rounded-md border border-border px-2 py-1 font-mono text-[10px] text-mute hover:text-destructive">Remove</button>
          </div>
        )}
      </div>

      {testResult && (
        <div className={`mt-2 inline-flex items-center gap-1 font-mono text-[10px] ${testResult.ok ? "text-primary" : "text-destructive"}`}>
          {testResult.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {testResult.ok ? `OK · ${testResult.message}` : testResult.message}
        </div>
      )}

      {(!status.connected || editing) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <input
            type="password"
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={`${status.label} API key`}
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/60"
          />
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder={`Default: ${status.defaultModel}`}
            className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary/60"
          />
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={busy || !keyInput.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
            </button>
            {editing && (
              <button onClick={() => { setEditing(false); setKeyInput(""); }} className="rounded-md border border-border px-2 py-2 text-xs text-mute">Cancel</button>
            )}
          </div>
          {err && <div className="sm:col-span-3 text-xs text-destructive">{err}</div>}
        </div>
      )}
    </div>
  );
}

export function NoKeyBanner() {
  return (
    <div className="mb-4 rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-primary">
      No AI provider key is configured.{" "}
      <Link to="/app/settings" className="underline underline-offset-2">Go to Settings</Link> to add your OpenRouter, OpenAI, Anthropic, Gemini, or Kimi key.
    </div>
  );
}
