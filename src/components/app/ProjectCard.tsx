import { Link } from "@tanstack/react-router";
import { ExternalLink, GitBranch, MoreHorizontal } from "lucide-react";
import type { Project } from "@/lib/mock/types";
import { statusDot, statusLabel, timeAgo } from "@/lib/format";

const thumbBg: Record<Project["thumbColor"], string> = {
  primary: "from-primary/30 to-primary/5",
  secondary: "from-secondary/40 to-secondary/5",
  warn: "from-status-warn/30 to-status-warn/5",
  muted: "from-muted-foreground/20 to-muted-foreground/5",
};

export function ProjectCard({
  project,
  onAction,
}: {
  project: Project;
  onAction?: (action: "duplicate" | "archive" | "delete", p: Project) => void;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong">
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${thumbBg[project.thumbColor]}`}>
        <div className="absolute inset-0 bg-grid-fine opacity-50" aria-hidden />
        <div className="absolute inset-3 grid grid-cols-4 gap-1.5">
          <div className="col-span-1 rounded bg-foreground/10" />
          <div className="col-span-3 space-y-1.5">
            <div className="h-2 w-2/3 rounded bg-foreground/30" />
            <div className="grid grid-cols-3 gap-1.5">
              <div className="h-6 rounded bg-foreground/15" />
              <div className="h-6 rounded bg-foreground/10" />
              <div className="h-6 rounded bg-primary/40" />
            </div>
            <div className="h-2 w-1/2 rounded bg-foreground/15" />
          </div>
        </div>
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] text-foreground backdrop-blur">
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`} />
          {statusLabel[project.status]}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-medium tracking-tight text-foreground">
            <Link to="/app/projects/$id" params={{ id: project.id }} className="hover:text-primary">
              {project.name}
            </Link>
          </h3>
          <ProjectMenu project={project} onAction={onAction} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-mute">{project.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mute">
          <span className="uppercase tracking-wider">{project.kind === "clone" ? "URL clone" : "Brief"}</span>
          <span className="h-3 w-px bg-border" />
          <span>{project.pointsSpent} CP</span>
          <span className="h-3 w-px bg-border" />
          <span>{timeAgo(project.lastActivity)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          {project.preview ? (
            <a
              href={`https://${project.preview.url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Open preview
            </a>
          ) : (
            <span className="font-mono text-[11px] text-mute">no preview yet</span>
          )}
          {project.repo && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-mute">
              <GitBranch className="h-3 w-3" />
              {project.repo}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectRow({
  project,
  onAction,
}: {
  project: Project;
  onAction?: (action: "duplicate" | "archive" | "delete", p: Project) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_120px_120px_140px_40px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface-2">
      <div className="min-w-0">
        <Link
          to="/app/projects/$id"
          params={{ id: project.id }}
          className="block truncate text-sm font-medium text-foreground hover:text-primary"
        >
          {project.name}
        </Link>
        <div className="truncate text-xs text-mute">{project.description}</div>
      </div>
      <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]}`} />
        {statusLabel[project.status]}
      </div>
      <div className="font-mono text-[11px] text-mute">{project.pointsSpent} CP</div>
      <div className="font-mono text-[11px] text-mute">{timeAgo(project.lastActivity)}</div>
      <ProjectMenu project={project} onAction={onAction} />
    </div>
  );
}

function ProjectMenu({
  project,
  onAction,
}: {
  project: Project;
  onAction?: (action: "duplicate" | "archive" | "delete", p: Project) => void;
}) {
  return (
    <details className="group/menu relative">
      <summary className="grid h-7 w-7 cursor-pointer list-none place-items-center rounded-md text-mute hover:bg-background hover:text-foreground [&::-webkit-details-marker]:hidden">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-border-strong bg-popover shadow-xl">
        <button
          onClick={() => onAction?.("duplicate", project)}
          className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-2"
        >
          Duplicate
        </button>
        <button
          onClick={() => onAction?.("archive", project)}
          className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface-2"
        >
          {project.status === "archived" ? "Restore" : "Archive"}
        </button>
        <button
          onClick={() => onAction?.("delete", project)}
          className="block w-full border-t border-border px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
        >
          Delete
        </button>
      </div>
    </details>
  );
}
