import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getProject, editProject, deleteProject, renameProject } from "@/lib/ai/projects.functions";
import { ArrowLeft, Send, Loader2, Trash2, RefreshCw, FileCode2, ExternalLink, Pencil, Check, X } from "lucide-react";

export const Route = createFileRoute("/app/projects/$id")({
  head: () => ({ meta: [{ title: "Project — CodingClerks" }] }),
  component: ProjectWorkspace,
});

type FileRow = { id: string; path: string; content: string };
type MessageRow = { id: string; role: "user" | "assistant" | "system"; content: string; created_at: string };
type Project = { id: string; title: string; status: string; kind: string };

function ProjectWorkspace() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchProject = useServerFn(getProject);
  const edit = useServerFn(editProject);
  const del = useServerFn(deleteProject);
  const rename = useServerFn(renameProject);

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"preview" | "code">("preview");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewKey, setPreviewKey] = useState(0);

  async function refresh() {
    try {
      const r = await fetchProject({ data: { id } });
      setProject(r.project as Project);
      setFiles(r.files as FileRow[]);
      setMessages(r.messages as MessageRow[]);
      if (!selectedPath && r.files.length > 0) {
        setSelectedPath((r.files.find((f: FileRow) => f.path === "index.html") ?? r.files[0]).path);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const instruction = input.trim();
    if (!instruction) return;
    setBusy(true);
    setErr(null);
    // optimistic
    setMessages((m) => [
      ...m,
      { id: "tmp-u-" + Date.now(), role: "user", content: instruction, created_at: new Date().toISOString() },
    ]);
    setInput("");
    try {
      await edit({ data: { id, instruction } });
      await refresh();
      setPreviewKey((k) => k + 1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
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
  const previewUrl = `/api/public/preview/${id}/index.html`;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface/40 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/app" className="inline-flex items-center gap-1 font-mono text-[11px] text-mute hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> projects
          </Link>
          <span className="text-border">/</span>
          {renaming ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(false); }}
                className="rounded border border-border bg-background px-2 py-0.5 text-sm outline-none focus:border-primary/60"
              />
              <button onClick={saveRename} className="rounded p-1 text-mute hover:text-foreground"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setRenaming(false)} className="rounded p-1 text-mute hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <button
              onClick={() => { setRenameValue(project.title); setRenaming(true); }}
              className="inline-flex items-center gap-1.5 truncate text-sm font-medium hover:text-primary"
            >
              {project.title}
              <Pencil className="h-3 w-3 text-mute" />
            </button>
          )}
          <span className="font-mono text-[10px] uppercase text-mute">{project.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] text-mute hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> open
          </a>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-mono text-[10px] text-mute hover:border-destructive/50 hover:text-destructive"
          >
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
                <li className="flex items-center gap-2 font-mono text-[11px] text-mute">
                  <Loader2 className="h-3 w-3 animate-spin" /> Applying edit — this can take up to a minute.
                </li>
              )}
            </ol>
          </div>
          {err && (
            <div className="border-t border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">{err}</div>
          )}
          <form onSubmit={onSend} className="border-t border-border bg-background/60 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSend(e as unknown as FormEvent); } }}
              placeholder="Ask the clerk to change something…"
              rows={3}
              disabled={busy}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-mute">⌘/Ctrl+↵ send</span>
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Send
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
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[10px] text-mute hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3" /> reload
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 bg-background">
            {rightTab === "preview" ? (
              <iframe
                key={previewKey}
                ref={iframeRef}
                src={previewUrl}
                title="Preview"
                sandbox="allow-scripts allow-forms allow-same-origin"
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="grid h-full grid-cols-[200px_minmax(0,1fr)]">
                <div className="min-h-0 overflow-auto border-r border-border bg-surface/20 py-2">
                  {files.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedPath(f.path)}
                      className={`flex w-full items-center gap-2 px-3 py-1 text-left font-mono text-[11px] ${f.path === selectedPath ? "bg-surface text-foreground" : "text-mute hover:text-foreground"}`}
                    >
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
    </div>
  );
}

function RightTabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1 text-xs ${active ? "bg-surface text-foreground" : "text-mute hover:text-foreground"}`}
    >
      {label}
    </button>
  );
}
