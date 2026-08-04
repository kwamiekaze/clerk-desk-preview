import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getProject, editProject, deleteProject, renameProject } from "@/lib/ai/projects.functions";
import { checkSlugAvailability, publishProject, unpublishProject, getProjectPublishState, suggestSlug } from "@/lib/ai/publish.functions";
import { pushProjectToGitHub } from "@/lib/ai/github.functions";
import { ArrowLeft, Send, Loader2, Trash2, RefreshCw, FileCode2, ExternalLink, Pencil, Check, X, Rocket, Github, AlertTriangle, Wand2, Copy } from "lucide-react";
import { MicButton } from "@/components/ui/MicButton";
import { ImageAttachments, type UploadedImage } from "@/components/upload/ImageAttachments";
import { CompilingOverlay } from "@/components/fx/CompilingOverlay";
import { CustomDomainPanel } from "@/components/builder/CustomDomainPanel";

export const Route = createFileRoute("/app/projects/$id")({
  head: () => ({ meta: [{ title: "Project — CodingClerks" }] }),
  component: ProjectWorkspace,
});

type FileRow = { id: string; path: string; content: string };
type MessageRow = { id: string; role: "user" | "assistant" | "system"; content: string; created_at: string };
type Project = { id: string; title: string; status: string; kind: string; github_repo?: string | null };
type PublishState = { slug: string; published_at: string; updated_at: string } | null;

function ProjectWorkspace() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchProject = useServerFn(getProject);
  const edit = useServerFn(editProject);
  const del = useServerFn(deleteProject);
  const rename = useServerFn(renameProject);
  const publish = useServerFn(publishProject);
  const unpublish = useServerFn(unpublishProject);
  const publishState = useServerFn(getProjectPublishState);
  const checkSlug = useServerFn(checkSlugAvailability);
  const suggest = useServerFn(suggestSlug);
  const push = useServerFn(pushProjectToGitHub);

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [busy, setBusy] = useState(false);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"preview" | "code">("preview");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  const [site, setSite] = useState<PublishState>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function refresh() {
    try {
      const r = await fetchProject({ data: { id } });
      setProject(r.project as Project);
      setFiles(r.files as FileRow[]);
      setMessages(r.messages as MessageRow[]);
      if (!selectedPath && r.files.length > 0) {
        setSelectedPath((r.files.find((f: FileRow) => f.path === "index.html") ?? r.files[0]).path);
      }
      publishState({ data: { projectId: id } }).then((p) => setSite(p.site as PublishState)).catch(() => {});
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id]);

  // Listen for preview runtime errors from the bridge
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data;
      if (!d || d.source !== "codingclerks" || d.type !== "error") return;
      setPreviewError(String(d.message).slice(0, 300));
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  async function runEdit(instruction: string, atts: UploadedImage[]) {
    setBusy(true);
    setErr(null);
    setMessages((m) => [...m, { id: "tmp-u-" + Date.now(), role: "user", content: instruction, created_at: new Date().toISOString() }]);
    try {
      const attachments = atts.length ? atts.map((i) => ({ path: i.path, url: i.url })) : undefined;
      await edit({ data: { id, instruction, attachments } });
      await refresh();
      setPreviewKey((k) => k + 1);
      setPreviewError(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const instruction = input.trim();
    if (!instruction) return;
    const atts = images;
    setInput("");
    setImages([]);
    await runEdit(instruction, atts);
  }

  async function onFixWithAI() {
    if (!previewError) return;
    await runEdit(`The preview is throwing this runtime error — find and fix it: ${previewError}`, []);
  }

  async function onDelete() {
    if (!confirm("Delete this project?")) return;
    await del({ data: { id } });
    navigate({ to: "/app" });
  }

  async function saveRename() {
    const t = renameValue.trim();
    if (!t) { setRenaming(false); return; }
    await rename({ data: { id, title: t } });
    setProject((p) => (p ? { ...p, title: t } : p));
    setRenaming(false);
  }

  if (loading) {
    return <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-mute" /></div>;
  }
  if (!project) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center">
        <p className="text-sm text-destructive">{err ?? "Project not found."}</p>
        <Link to="/app" className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> back to dashboard
        </Link>
      </div>
    );
  }

  const selectedFile = files.find((f) => f.path === selectedPath) ?? null;
  const previewUrl = `/api/public/preview/${id}/index.html?bridge=1`;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <CompilingOverlay open={busy} />

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface/40 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/app" className="inline-flex items-center gap-1 font-mono text-[11px] text-mute hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> projects
          </Link>
          <span className="text-border">/</span>
          {renaming ? (
            <div className="flex items-center gap-1">
              <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(false); }}
                className="rounded border border-border bg-background px-2 py-0.5 text-sm outline-none focus:border-primary/60" />
              <button onClick={saveRename} className="rounded p-1 text-mute hover:text-foreground"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setRenaming(false)} className="rounded p-1 text-mute hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => { setRenameValue(project.title); setRenaming(true); }}
              className="inline-flex items-center gap-1.5 truncate text-sm font-medium hover:text-primary">
              {project.title} <Pencil className="h-3 w-3 text-mute" />
            </button>
          )}
          <span className="font-mono text-[10px] uppercase text-mute">{project.status}</span>
          {site && (
            <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary hover:bg-primary/20">
              <Rocket className="h-3 w-3" /> /{site.slug}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPublish(true)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 font-mono text-[10px] font-medium text-primary-foreground shadow-[0_0_20px_-4px_rgba(0,255,65,0.6)] hover:bg-primary/90">
            <Rocket className="h-3 w-3" /> {site ? "republish" : "launch"}
          </button>
          <button onClick={() => setShowPush(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] text-mute hover:border-primary/50 hover:text-primary">
            <Github className="h-3 w-3" /> push
          </button>
          <a href={previewUrl.replace("?bridge=1", "")} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] text-mute hover:text-foreground">
            <ExternalLink className="h-3 w-3" /> open
          </a>
          <button onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] text-mute hover:border-destructive/50 hover:text-destructive">
            <Trash2 className="h-3 w-3" /> delete
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Chat pane */}
        <aside className="flex min-h-0 flex-col border-r border-border bg-surface/30">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <ol className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className={m.role === "user" ? "" : "text-mute"}>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-mute">
                    {m.role === "user" ? "you" : m.role === "assistant" ? "clerk" : "system"}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">{m.content}</div>
                </li>
              ))}
              {busy && (
                <li className="flex items-center gap-2 font-mono text-[11px] text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" /> Applying edit…
                </li>
              )}
            </ol>
          </div>
          {err && <div className="border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">{err}</div>}
          <form onSubmit={onSend} className="border-t border-border bg-background/60 p-3">
            <div className="relative">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSend(e as unknown as FormEvent); } }}
                placeholder="Ask the clerk to change something…" rows={3} disabled={busy}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 pr-12 text-sm outline-none focus:border-primary/60" />
              <div className="absolute right-2 top-2"><MicButton value={input} onChange={setInput} /></div>
            </div>
            <div className="mt-2">
              <ImageAttachments value={images} onChange={setImages} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-mute">⌘/Ctrl+↵ send</span>
              <button type="submit" disabled={busy || !input.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Send
              </button>
            </div>
          </form>
        </aside>

        {/* Right pane */}
        <section className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-border bg-surface/20 px-3 py-2">
            <div className="inline-flex rounded-md border border-border bg-background p-0.5">
              <RightTabBtn active={rightTab === "preview"} onClick={() => setRightTab("preview")} label="Preview" />
              <RightTabBtn active={rightTab === "code"} onClick={() => setRightTab("code")} label="Code" />
            </div>
            {rightTab === "preview" && (
              <button onClick={() => { setPreviewKey((k) => k + 1); setPreviewError(null); }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[10px] text-mute hover:text-foreground">
                <RefreshCw className="h-3 w-3" /> reload
              </button>
            )}
          </div>
          {previewError && rightTab === "preview" && (
            <div className="flex items-center justify-between gap-3 border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <div className="flex min-w-0 items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{previewError}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onFixWithAI} disabled={busy}
                  className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary hover:bg-primary/20 disabled:opacity-50">
                  <Wand2 className="h-3 w-3" /> Fix with AI
                </button>
                <button onClick={() => setPreviewError(null)} className="text-mute hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
            </div>
          )}
          <div className="min-h-0 flex-1 bg-background">
            {rightTab === "preview" ? (
              <iframe key={previewKey} ref={iframeRef} src={previewUrl} title="Preview"
                sandbox="allow-scripts allow-forms allow-same-origin"
                className="h-full w-full border-0 bg-white" />
            ) : (
              <div className="grid h-full grid-cols-[200px_minmax(0,1fr)]">
                <div className="min-h-0 overflow-auto border-r border-border bg-surface/20 py-2">
                  {files.map((f) => (
                    <button key={f.id} onClick={() => setSelectedPath(f.path)}
                      className={`flex w-full items-center gap-2 px-3 py-1 text-left font-mono text-[11px] ${f.path === selectedPath ? "bg-surface text-foreground" : "text-mute hover:text-foreground"}`}>
                      <FileCode2 className="h-3 w-3" /> {f.path}
                    </button>
                  ))}
                </div>
                <div className="min-h-0 overflow-auto">
                  <pre className="m-0 p-3 font-mono text-[11.5px] leading-5 text-foreground/85"><code>{selectedFile?.content ?? ""}</code></pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="px-3 pb-6 sm:px-4">
        <CustomDomainPanel projectId={id} slug={site?.slug ?? null} />
      </div>



      {showPublish && (
        <PublishDialog
          projectTitle={project.title}
          existing={site}
          onClose={() => setShowPublish(false)}
          onSuggest={async () => (await suggest({ data: { title: project.title } })).slug}
          onCheck={async (slug) => await checkSlug({ data: { slug } })}
          onPublish={async (slug) => {
            const r = await publish({ data: { projectId: id, slug } });
            setSite({ slug: r.slug, published_at: new Date().toISOString(), updated_at: new Date().toISOString() });
          }}
          onUnpublish={async () => { await unpublish({ data: { projectId: id } }); setSite(null); }}
        />
      )}

      {showPush && (
        <PushDialog
          currentRepo={project.github_repo ?? null}
          onClose={() => setShowPush(false)}
          onPush={async (repoName) => await push({ data: { projectId: id, repoName: repoName || undefined } })}
        />
      )}
    </div>
  );
}

function RightTabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`rounded px-3 py-1 text-xs ${active ? "bg-surface text-foreground" : "text-mute hover:text-foreground"}`}>
      {label}
    </button>
  );
}

function PublishDialog({
  projectTitle, existing, onClose, onSuggest, onCheck, onPublish, onUnpublish,
}: {
  projectTitle: string;
  existing: PublishState;
  onClose: () => void;
  onSuggest: () => Promise<string>;
  onCheck: (slug: string) => Promise<{ ok: boolean; reason?: string }>;
  onPublish: (slug: string) => Promise<void>;
  onUnpublish: () => Promise<void>;
}) {
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [status, setStatus] = useState<{ ok: boolean | null; reason?: string; checking: boolean }>({ ok: null, checking: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!existing && !slug) {
      onSuggest().then(setSlug).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!slug) { setStatus({ ok: null, checking: false }); return; }
    setStatus((s) => ({ ...s, checking: true }));
    const t = setTimeout(async () => {
      try {
        const r = await onCheck(slug);
        setStatus({ ok: r.ok, reason: r.reason, checking: false });
      } catch { setStatus({ ok: false, reason: "Could not check.", checking: false }); }
    }, 300);
    return () => clearTimeout(t);
  }, [slug, onCheck]);

  const liveUrl = existing ? `${window.location.origin}/${existing.slug}` : "";

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      await onPublish(slug.trim());
      onClose();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-primary/30 bg-background p-6 shadow-[0_0_60px_-10px_rgba(0,255,65,0.4)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-sm uppercase tracking-wider text-primary text-glow">Launch site</h3>
          <button onClick={onClose} className="text-mute hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {existing && (
          <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="mb-1 font-mono text-[10px] uppercase text-mute">Currently published</div>
            <div className="flex items-center justify-between">
              <a href={liveUrl} target="_blank" rel="noreferrer" className="truncate text-sm text-primary hover:underline">{liveUrl}</a>
              <button
                onClick={() => { navigator.clipboard.writeText(liveUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="ml-2 inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 font-mono text-[10px] text-mute hover:text-foreground"
              >
                <Copy className="h-3 w-3" /> {copied ? "copied" : "copy"}
              </button>
            </div>
          </div>
        )}

        <label className="mb-1 block font-mono text-[10px] uppercase text-mute">Slug</label>
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface px-2 focus-within:border-primary/60">
          <span className="font-mono text-[11px] text-mute">codingclerks.com/</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="my-site" autoFocus
            className="flex-1 bg-transparent py-2 font-mono text-sm outline-none" />
          {slug && status.checking && <Loader2 className="h-3.5 w-3.5 animate-spin text-mute" />}
          {slug && !status.checking && status.ok === true && <Check className="h-3.5 w-3.5 text-primary" />}
          {slug && !status.checking && status.ok === false && <X className="h-3.5 w-3.5 text-destructive" />}
        </div>
        {slug && status.ok === false && <div className="mt-1 text-xs text-destructive">{status.reason}</div>}
        <div className="mt-1 font-mono text-[10px] text-mute">Suggested from: “{projectTitle}”</div>

        {err && <div className="mt-3 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{err}</div>}

        <div className="mt-5 flex items-center justify-between gap-2">
          {existing ? (
            <button onClick={async () => { if (!confirm("Unpublish this site?")) return; setBusy(true); try { await onUnpublish(); onClose(); } finally { setBusy(false); } }}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-mute hover:border-destructive/60 hover:text-destructive">
              Unpublish
            </button>
          ) : <span />}
          <button disabled={busy || status.ok !== true} onClick={submit}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_0_20px_-4px_rgba(0,255,65,0.6)] hover:bg-primary/90 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {existing ? "Republish" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PushDialog({
  currentRepo, onClose, onPush,
}: {
  currentRepo: string | null;
  onClose: () => void;
  onPush: (repoName: string) => Promise<{ ok: true; url: string; repo: string }>;
}) {
  const [repo, setRepo] = useState(currentRepo?.split("/")[1] ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; repo: string } | null>(null);

  async function submit() {
    setErr(null); setBusy(true);
    try { const r = await onPush(repo.trim()); setResult({ url: r.url, repo: r.repo }); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-sm uppercase tracking-wider text-primary">Push to GitHub</h3>
          <button onClick={onClose} className="text-mute hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        {result ? (
          <div className="space-y-3">
            <p className="text-sm">Pushed to <a href={result.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{result.repo}</a>.</p>
            <button onClick={onClose} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Done</button>
          </div>
        ) : (
          <>
            <label className="mb-1 block font-mono text-[10px] uppercase text-mute">Repo name</label>
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="my-clerks-app"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary/60" />
            <p className="mt-2 text-xs text-mute">Pro only. Requires a GitHub Personal Access Token saved in Settings.</p>
            {err && <div className="mt-3 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{err}</div>}
            <button onClick={submit} disabled={busy || !repo.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />} Push
            </button>
          </>
        )}
      </div>
    </div>
  );
}
