import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ProjectCard, ProjectRow } from "@/components/app/ProjectCard";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import {
  CardSkeleton,
  EmptyProjects,
  ErrorState,
  FirstProjectState,
} from "@/components/app/States";
import { mockApi } from "@/lib/mock/service";
import type { Folder, Project } from "@/lib/mock/types";
import {
  Grid3x3,
  List,
  Search,
  SlidersHorizontal,
  Folder as FolderIcon,
  Plus,
} from "lucide-react";

type ViewMode = "grid" | "list";
type StatusFilter = Project["status"] | "all";
type Sort = "recent" | "name" | "points";

export const Route = createFileRoute("/app/projects/")({
  head: () => ({ meta: [{ title: "Projects — CodingClerks" }] }),
  component: ProjectsLibrary,
});

function ProjectsLibrary() {
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [folderId, setFolderId] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<
    | { kind: "delete" | "archive"; project: Project }
    | null
  >(null);

  useEffect(() => {
    mockApi.listFolders().then(setFolders);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    mockApi
      .listProjects({ search, folderId, status, sort })
      .then((p) => {
        if (!alive) return;
        setProjects(p);
        setLoading(false);
      })
      .catch(() => alive && setError("The bureau could not load your projects."));
    return () => {
      alive = false;
    };
  }, [search, folderId, status, sort]);

  const totalAcrossAll = useMemo(
    () => folders.find((f) => f.id === "all")?.projectCount ?? null,
    [folders],
  );

  const isFirstUser = totalAcrossAll === 0;

  function handleAction(action: "duplicate" | "archive" | "delete", p: Project) {
    if (action === "duplicate") {
      mockApi.duplicateProject(p.id).then(() => {
        setProjects((cur) => [{ ...p, id: "p_dup_" + p.id, name: p.name + " (copy)" }, ...cur]);
      });
    } else {
      setConfirm({ kind: action, project: p });
    }
  }

  async function performConfirmed() {
    if (!confirm) return;
    const { kind, project } = confirm;
    setConfirm(null);
    if (kind === "delete") {
      await mockApi.deleteProject(project.id);
      setProjects((cur) => cur.filter((p) => p.id !== project.id));
    } else {
      await mockApi.archiveProject(project.id);
      setProjects((cur) =>
        cur.map((p) => (p.id === project.id ? { ...p, status: "archived" as const } : p)),
      );
    }
  }

  return (
    <AppShell
      eyebrow="Library"
      title="Projects"
      actions={
        <Link
          to="/app/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Folders */}
        <aside>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
            Folders
          </div>
          <ul className="mt-2 space-y-0.5">
            {folders.map((f) => {
              const active = folderId === f.id;
              return (
                <li key={f.id}>
                  <button
                    onClick={() => setFolderId(f.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                      active ? "bg-surface text-foreground" : "text-mute hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderIcon className={`h-3.5 w-3.5 ${active ? "text-primary" : ""}`} />
                      {f.name}
                    </span>
                    <span className="font-mono text-[10px] text-mute">{f.projectCount}</span>
                  </button>
                </li>
              );
            })}
            <li>
              <button className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-mute hover:bg-surface hover:text-foreground">
                <Plus className="h-3.5 w-3.5" /> New folder
              </button>
            </li>
          </ul>
        </aside>

        {/* Main */}
        <section>
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-mute" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-full bg-transparent text-sm placeholder:text-mute/70 focus:outline-none"
              />
            </div>
            <FilterSelect
              icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              value={status}
              onChange={(v) => setStatus(v as StatusFilter)}
              options={[
                { v: "all", l: "All status" },
                { v: "draft", l: "Draft" },
                { v: "building", l: "Building" },
                { v: "preview", l: "Preview" },
                { v: "deployed", l: "Deployed" },
                { v: "archived", l: "Archived" },
              ]}
            />
            <FilterSelect
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={[
                { v: "recent", l: "Most recent" },
                { v: "name", l: "Name A→Z" },
                { v: "points", l: "Most CP" },
              ]}
            />
            <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
              {(["grid", "list"] as ViewMode[]).map((m) => {
                const active = view === m;
                const Icon = m === "grid" ? Grid3x3 : List;
                return (
                  <button
                    key={m}
                    onClick={() => setView(m)}
                    aria-label={`${m} view`}
                    className={`grid h-7 w-7 place-items-center rounded ${
                      active ? "bg-background text-foreground" : "text-mute hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <ErrorState message={error} onRetry={() => location.reload()} />
          ) : loading ? (
            view === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border bg-surface">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border-b border-border px-4 py-3 last:border-b-0">
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            )
          ) : isFirstUser ? (
            <FirstProjectState />
          ) : projects.length === 0 ? (
            <EmptyProjects />
          ) : view === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onAction={handleAction} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="grid grid-cols-[1fr_120px_120px_140px_40px] gap-3 border-b border-border bg-surface-2/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
                <span>Project</span>
                <span>Status</span>
                <span>Spent</span>
                <span>Updated</span>
                <span />
              </div>
              {projects.map((p) => (
                <ProjectRow key={p.id} project={p} onAction={handleAction} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === "delete"
            ? `Delete "${confirm.project.name}"?`
            : `Archive "${confirm?.project.name}"?`
        }
        description={
          confirm?.kind === "delete"
            ? "This permanently removes the project, its preview, and the ledger entries. The exported repo is unaffected."
            : "The project is hidden from your library and stops consuming CP. You can restore it any time."
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete project" : "Archive"}
        destructive={confirm?.kind === "delete"}
        onConfirm={performConfirmed}
        onClose={() => setConfirm(null)}
      />
    </AppShell>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm hover:border-border-strong">
      {icon}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm text-foreground focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-popover text-foreground">
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}
