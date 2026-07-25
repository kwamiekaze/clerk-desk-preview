import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listProjects, generateProject, cloneProject, deleteProject } from "@/lib/ai/projects.functions";
import { Loader2, Sparkles, Link2, Trash2, ArrowRight, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — CodingClerks" }] }),
  component: Dashboard,
});

type ProjectRow = { id: string; title: string; kind: string; status: string; updated_at: string };

function Dashboard() {
  const navigate = useNavigate();
  const list = useServerFn(listProjects);
  const gen = useServerFn(generateProject);
  const clone = useServerFn(cloneProject);
  const del = useServerFn(deleteProject);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [tab, setTab] = useState<"prompt" | "clone">("prompt");
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  async function refresh() {
    setLoadingList(true);
    try { setProjects((await list()) as ProjectRow[]); } finally { setLoadingList(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = tab === "prompt"
        ? await gen({ data: { prompt: prompt.trim() } })
        : await clone({ data: { url: url.trim() } });
      navigate({ to: "/app/projects/$id", params: { id: r.id } });
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await del({ data: { id } });
    setProjects((p) => p.filter((x) => x.id !== id));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Dispatch</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Start a new build.</h1>
          <p className="mt-1 text-sm text-mute">Describe an app or paste a URL to clone. Your clerks handle the rest.</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 inline-flex rounded-md border border-border bg-background p-0.5">
          <TabBtn active={tab === "prompt"} onClick={() => setTab("prompt")} icon={Sparkles} label="Prompt" />
          <TabBtn active={tab === "clone"} onClick={() => setTab("clone")} icon={Link2} label="Clone URL" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {tab === "prompt" ? (
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A landing page for a boutique roastery in Lisbon with a menu of six single-origin coffees and a subscription CTA."
              rows={4}
              required
              minLength={10}
              disabled={busy}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={busy}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          )}
          {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <div className="flex items-center justify-between">
            <div className="font-mono text-[11px] text-mute">
              {tab === "prompt" ? "Detail wins: mention audience, tone, and pages." : "Public HTTP(S) URLs only. Structure preserved, design refreshed."}
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Building…</> : <>Dispatch <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-medium tracking-tight">Your projects</h2>
          <div className="font-mono text-[11px] text-mute">{projects.length} total</div>
        </div>
        {loadingList ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-mute" /></div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface/40 p-8 text-center text-sm text-mute">
            No projects yet. Dispatch your first build above.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id} className="group flex flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/app/projects/$id" params={{ id: p.id }} className="flex-1 truncate text-base font-medium hover:text-primary">
                    {p.title}
                  </Link>
                  <button onClick={() => onDelete(p.id)} className="rounded p-1 text-mute opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mute">
                  <span>{p.kind}</span>
                  <span className="text-border">·</span>
                  <StatusPill status={p.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-mono text-[10px] text-mute">{new Date(p.updated_at).toLocaleDateString()}</div>
                  <Link
                    to="/app/projects/$id"
                    params={{ id: p.id }}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Sparkles; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium ${active ? "bg-surface text-foreground" : "text-mute hover:text-foreground"}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls = status === "ready" ? "text-status-ok" : status === "building" ? "text-status-warn" : "text-destructive";
  return <span className={cls}>{status}</span>;
}
