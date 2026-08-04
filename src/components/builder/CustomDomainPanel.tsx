import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Loader2, Plus, RefreshCw, Trash2, Copy, Check } from "lucide-react";
import { listMyDomains, addDomain, removeDomain, checkDomainStatus } from "@/lib/ai/domains.functions";

type DomainRow = {
  id: string;
  domain: string;
  mode: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export function CustomDomainPanel({ projectId, slug }: { projectId: string; slug: string | null }) {
  const list = useServerFn(listMyDomains);
  const add = useServerFn(addDomain);
  const drop = useServerFn(removeDomain);
  const check = useServerFn(checkDomainStatus);

  const [rows, setRows] = useState<DomainRow[] | null>(null);
  const [fullAvailable, setFullAvailable] = useState(false);
  const [appHost, setAppHost] = useState("codingclerks.com");
  const [mode, setMode] = useState<"forwarding" | "cname">("forwarding");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cname, setCname] = useState<{ host: string; target: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  async function refresh() {
    const r = await list({ data: { projectId } });
    setRows(r.domains as DomainRow[]);
    setFullAvailable(r.fullDomainsAvailable);
    setAppHost(r.appHost);
  }
  useEffect(() => { refresh().catch(() => setRows([])); /* eslint-disable-next-line */ }, [projectId]);

  const forwardTarget = slug ? `https://${appHost}/${slug}` : null;

  async function onAdd() {
    if (!input.trim()) return;
    setBusy(true); setErr(null); setNote(null); setCname(null);
    try {
      const r = await add({ data: { projectId, domain: input.trim(), mode } });
      setInput("");
      setNote(r.note ?? null);
      setCname(r.cname ?? null);
      await refresh();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  function copy(text: string, tag: string) {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <section className="rounded-xl border border-border bg-surface/60 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-xs uppercase tracking-wider text-primary">Custom domain</h3>
      </div>

      {!slug ? (
        <p className="mt-2 text-xs text-mute">Publish this project first — then you can point a domain you own at it.</p>
      ) : (
        <>
          <p className="mt-2 text-xs text-mute">
            Use a domain you bought at GoDaddy, Namecheap, or anywhere else. Two ways to do it:
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("forwarding")}
              className={`rounded-lg border p-3 text-left transition-colors ${mode === "forwarding" ? "border-primary/60 bg-primary/5" : "border-border hover:border-border-strong"}`}
            >
              <div className="text-sm font-medium">Quick redirect</div>
              <div className="mt-1 text-xs text-mute">Works today, no waiting. Your domain forwards visitors to your published page.</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("cname")}
              className={`rounded-lg border p-3 text-left transition-colors ${mode === "cname" ? "border-primary/60 bg-primary/5" : "border-border hover:border-border-strong"}`}
            >
              <div className="text-sm font-medium">Full custom domain</div>
              <div className="mt-1 text-xs text-mute">
                Your own URL stays in the address bar, with HTTPS. {fullAvailable ? "Available on this deployment." : "Not active on this deployment yet."}
              </div>
            </button>
          </div>

          {mode === "forwarding" && forwardTarget && (
            <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-mute">Forward to</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="truncate font-mono text-xs text-primary">{forwardTarget}</code>
                <button onClick={() => copy(forwardTarget, "fwd")} className="rounded border border-border p-1 text-mute hover:text-primary">
                  {copied === "fwd" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-mute">GoDaddy, step by step</div>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-mute">
                <li>Sign in to GoDaddy and open <span className="text-foreground">My Products → your domain → Domain Settings</span>.</li>
                <li>Scroll to <span className="text-foreground">Forwarding</span> and choose <span className="text-foreground">Add forwarding</span> for the Domain (not subdomain).</li>
                <li>Paste the URL above into <span className="text-foreground">Forward to</span>.</li>
                <li>Set <span className="text-foreground">Redirect type: Permanent (301)</span>.</li>
                <li>Set <span className="text-foreground">Forward settings: Forward only</span> — not "Forward with masking".</li>
                <li>Save. It usually takes a few minutes to start working.</li>
              </ol>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-mute">Other registrars</div>
              <p className="mt-1 text-xs text-mute">
                Look for "Forwarding", "Redirect", or "URL redirect" in your domain's DNS settings, then forward the domain to the URL above with a permanent (301) redirect, forward-only.
              </p>
              <p className="mt-2 rounded border border-warn/40 bg-warn/10 p-2 text-xs text-warn">
                Heads up: with a redirect, the browser address bar will show <code className="font-mono">{appHost}/{slug}</code> after the jump — not your own domain. Choose "Full custom domain" if you need your domain to stay visible.
              </p>
            </div>
          )}

          {mode === "cname" && (
            <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-xs text-mute">
              {fullAvailable ? (
                <>
                  Add your domain below and we'll request an HTTPS certificate for it. You'll then add one CNAME record at your registrar.
                  <div className="mt-1">Subdomains only for now (e.g. <code className="font-mono text-foreground">www.example.com</code>). For a root domain, use your registrar's "forward apex to www" rule alongside the CNAME on <code className="font-mono">www</code>.</div>
                </>
              ) : (
                <>Full custom domains aren't switched on for this deployment yet. You can still save your domain here, and the quick redirect option works right now.</>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="www.yourdomain.com"
              className="min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={onAdd}
              disabled={busy || !input.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Connect domain
            </button>
          </div>
          {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
          {note && <div className="mt-2 rounded border border-primary/40 bg-primary/10 p-2 text-xs text-primary">{note}</div>}
          {cname && (
            <div className="mt-2 rounded border border-border bg-background/40 p-2 font-mono text-[11px]">
              <div className="text-mute">CNAME record to add at your registrar</div>
              <div className="mt-1">Host: <span className="text-primary">{cname.host}</span></div>
              <div>Target: <span className="text-primary">{cname.target}</span></div>
            </div>
          )}

          <div className="mt-4">
            {rows === null ? (
              <Loader2 className="h-4 w-4 animate-spin text-mute" />
            ) : rows.length === 0 ? (
              <div className="text-xs text-mute">No domains connected yet.</div>
            ) : (
              <ul className="space-y-2">
                {rows.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/40 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs text-foreground">{d.domain}</div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                        <span className="text-mute">{d.mode === "cname" ? "full domain" : "redirect"}</span>
                        <span className={d.status === "active" ? "text-primary" : d.status === "error" ? "text-destructive" : "text-warn"}>{d.status}</span>
                      </div>
                      {d.error_message && <div className="mt-1 text-[11px] text-destructive">{d.error_message}</div>}
                      {statusMsg[d.id] && <div className="mt-1 text-[11px] text-mute">{statusMsg[d.id]}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          const r = await check({ data: { domainId: d.id } });
                          setStatusMsg((s) => ({ ...s, [d.id]: r.message }));
                          refresh().catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[10px] text-mute hover:border-primary/60 hover:text-primary"
                      >
                        <RefreshCw className="h-3 w-3" /> Check
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Disconnect ${d.domain}?`)) return;
                          await drop({ data: { domainId: d.id } });
                          refresh().catch(() => {});
                        }}
                        className="rounded-md border border-border p-1 text-mute hover:border-destructive/60 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
