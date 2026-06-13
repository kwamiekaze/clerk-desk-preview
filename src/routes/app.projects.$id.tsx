import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, MessageSquare, FileCode2, Eye, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { InitProgress } from "@/components/app/InitProgress";
import { ProjectToolbar } from "@/components/builder/ProjectToolbar";
import { ClerkChat } from "@/components/builder/ClerkChat";
import { FileTree } from "@/components/builder/FileTree";
import { CodeView } from "@/components/builder/CodeView";
import { LivePreview } from "@/components/builder/LivePreview";
import { GithubDialog, VercelDialog, ShareDialog, VersionHistoryDialog } from "@/components/builder/Dialogs";
import { builderApi, type BranchInfo, type BuildError, type BuildState, type ChatMessage, type FileNode, type Version } from "@/lib/mock/builder";

export const Route = createFileRoute("/app/projects/$id")({
  validateSearch: (s: Record<string, unknown>) => ({
    init: s.init === 1 || s.init === "1" ? 1 : 0,
  }),
  head: () => ({ meta: [{ title: "Builder — CodingClerks" }] }),
  component: ProjectDetail,
});

type Pane = "chat" | "code" | "preview";

function ProjectDetail() {
  const { id } = Route.useParams();
  const { init } = Route.useSearch();

  if (init) {
    return (
      <AppShell
        eyebrow="Project"
        title="Initializing project"
        actions={
          <nav className="flex items-center gap-1 font-mono text-[11px] text-mute">
            <Link to="/app/projects" className="hover:text-foreground">Projects</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{id}</span>
          </nav>
        }
      >
        <InitProgress projectId={id} />
      </AppShell>
    );
  }
  return <Builder id={id} />;
}

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "seed1",
    role: "clerk",
    text: "Scaffolded a Vite + React + Tailwind project from your brief. The hero, feature grid, and CTA are wired in App.tsx.",
    at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    receipt: { pointsSpent: 9, tokens: 41200, ms: 12800 },
  },
];

function Builder({ id }: { id: string }) {
  const [branch, setBranch] = useState<BranchInfo>({ name: "main", ahead: 2, behind: 0, dirty: true });
  const [state, setState] = useState<BuildState>("ready");
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState<string | null>("src/components/Hero.tsx");
  const [pinned, setPinned] = useState<string[]>(["src/components/Hero.tsx"]);
  const [errors, setErrors] = useState<BuildError[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [pane, setPane] = useState<Pane>("chat");

  const [openGh, setOpenGh] = useState(false);
  const [openVc, setOpenVc] = useState(false);
  const [openShare, setOpenShare] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    builderApi.getProject(id).then((p) => { if (!cancelled) setBranch(p.branch); });
    builderApi.listFiles(id).then((f) => { if (!cancelled) setFiles(f); });
    builderApi.listVersions(id).then((v) => { if (!cancelled) setVersions(v); });
    builderApi.listErrors(id).then((e) => { if (!cancelled) setErrors(e); });
    return () => { cancelled = true; };
  }, [id]);

  // Keyboard shortcuts: g c / g f / g p — switch panes; ⌘/ — focus chat
  useEffect(() => {
    let pendingG = false;
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA";
      if ((e.metaKey || e.ctrlKey) && e.key === "/") { e.preventDefault(); setPane("chat"); return; }
      if (inField) return;
      if (e.key === "g") { pendingG = true; setTimeout(() => (pendingG = false), 700); return; }
      if (pendingG) {
        if (e.key === "c") setPane("chat");
        if (e.key === "f") setPane("code");
        if (e.key === "p") setPane("preview");
        pendingG = false;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  function togglePin(path: string) {
    setPinned((p) => (p.includes(path) ? p.filter((x) => x !== path) : [...p, path]));
  }

  function triggerRepair() {
    // Real impl: call streamChat with a system-authored "Repair build errors" prompt.
    setErrors([]);
    setState("thinking");
    setTimeout(() => setState("ready"), 1400);
  }

  const changed = files.filter((f) => f.changed);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between border-b border-border bg-background/80 px-3 backdrop-blur">
        <Link to="/app/projects" className="inline-flex items-center gap-1 font-mono text-[11px] text-mute hover:text-foreground">
          <ChevronLeft className="h-3 w-3" /> projects
        </Link>
        <div className="font-mono text-[11px] text-mute">⌘/ chat · g c · g f · g p</div>
      </header>

      <ProjectToolbar
        name={id}
        branch={branch}
        state={state}
        onShare={() => setOpenShare(true)}
        onGithub={() => setOpenGh(true)}
        onDeploy={() => setOpenVc(true)}
        onHistory={() => setOpenHistory(true)}
      />

      {/* Desktop / tablet: three-panel grid */}
      <div className="hidden flex-1 min-h-0 lg:grid lg:grid-cols-[360px_minmax(0,1fr)_minmax(0,1fr)]">
        <aside className="min-h-0 border-r border-border bg-surface/30">
          <ClerkChat
            initialMessages={SEED_MESSAGES}
            onState={setState}
            pinnedScope={pinned}
            onJumpToFile={(p) => setSelected(p)}
          />
        </aside>
        <section className="grid min-h-0 grid-rows-[1fr_auto] border-r border-border">
          <div className="grid min-h-0 grid-cols-[220px_minmax(0,1fr)]">
            <div className="min-h-0 border-r border-border bg-surface/20">
              <FileTree files={files} selected={selected} onSelect={setSelected} pinned={pinned} onTogglePin={togglePin} />
            </div>
            <div className="min-h-0">
              <CodeView projectId={id} path={selected} />
            </div>
          </div>
          <ChangedFooter changed={changed} />
        </section>
        <section className="min-h-0">
          <LivePreview url="https://sandbox.codingclerks.dev" errors={errors} onRepair={triggerRepair} />
        </section>
      </div>

      {/* Mobile/tablet stack with tab switcher */}
      <div className="flex flex-1 min-h-0 flex-col lg:hidden">
        <div className="grid grid-cols-3 border-b border-border bg-surface/40 font-mono text-[10px]">
          <TabPill active={pane === "chat"} onClick={() => setPane("chat")} icon={MessageSquare} label="Chat" />
          <TabPill active={pane === "code"} onClick={() => setPane("code")} icon={FileCode2} label="Code" />
          <TabPill active={pane === "preview"} onClick={() => setPane("preview")} icon={Eye} label="Preview" />
        </div>
        <div className="flex-1 min-h-0">
          {pane === "chat" && <ClerkChat initialMessages={SEED_MESSAGES} onState={setState} pinnedScope={pinned} onJumpToFile={(p) => { setSelected(p); setPane("code"); }} />}
          {pane === "code" && (
            <div className="grid h-full grid-cols-[180px_minmax(0,1fr)]">
              <div className="border-r border-border bg-surface/20"><FileTree files={files} selected={selected} onSelect={setSelected} pinned={pinned} onTogglePin={togglePin} /></div>
              <CodeView projectId={id} path={selected} />
            </div>
          )}
          {pane === "preview" && <LivePreview url="https://sandbox.codingclerks.dev" errors={errors} onRepair={triggerRepair} />}
        </div>
      </div>

      <GithubDialog open={openGh} onClose={() => setOpenGh(false)} />
      <VercelDialog open={openVc} onClose={() => setOpenVc(false)} />
      <ShareDialog open={openShare} onClose={() => setOpenShare(false)} />
      <VersionHistoryDialog open={openHistory} onClose={() => setOpenHistory(false)} versions={versions} />
    </div>
  );
}

function TabPill({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof MessageSquare; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-2.5 ${active ? "border-b-2 border-primary text-primary" : "text-mute"}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function ChangedFooter({ changed }: { changed: FileNode[] }) {
  if (changed.length === 0) {
    return (
      <div className="border-t border-border bg-surface/40 px-3 py-2 font-mono text-[10px] text-mute">
        No file changes in this session.
      </div>
    );
  }
  const added = changed.filter((c) => c.changed === "added").length;
  const mod = changed.filter((c) => c.changed === "modified").length;
  const del = changed.filter((c) => c.changed === "deleted").length;
  return (
    <div className="flex items-center gap-3 border-t border-border bg-surface/40 px-3 py-2 font-mono text-[10px] text-mute">
      <span>changes</span>
      <span className="text-status-ok">+{added}</span>
      <span className="text-status-warn">~{mod}</span>
      <span className="text-destructive">−{del}</span>
      <div className="ml-auto flex flex-wrap gap-1">
        {changed.slice(0, 4).map((c) => (
          <span key={c.path} className="rounded border border-border bg-background px-1.5 py-0.5">{c.path.split("/").pop()}</span>
        ))}
        {changed.length > 4 && <span>+{changed.length - 4} more</span>}
      </div>
    </div>
  );
}
