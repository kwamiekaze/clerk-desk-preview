import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  PlusSquare,
  Sparkles,
  GitBranch,
  Settings,
  LifeBuoy,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { PointsBadge } from "./PointsBadge";

const PRIMARY: Array<{ label: string; to: "/app" | "/app/projects" | "/app/projects/new"; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard, exact: true },
  { label: "Projects", to: "/app/projects", icon: FolderKanban },
  { label: "New project", to: "/app/projects/new", icon: PlusSquare },
];

const SECONDARY = [
  { label: "Models", icon: Sparkles, badge: "soon" },
  { label: "GitHub", icon: GitBranch },
  { label: "Settings", icon: Settings },
  { label: "Support", icon: LifeBuoy },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between px-4 py-3.5">
        <Link to="/app" onClick={onNavigate}><Wordmark /></Link>
      </div>

      <div className="px-3">
        <WorkspaceSelector />
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-4" aria-label="Workspace">
        <SectionLabel>Bureau</SectionLabel>
        <ul className="mb-4 space-y-0.5">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-background text-foreground"
                      : "text-mute hover:bg-background hover:text-foreground"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 h-5 w-0.5 rounded-r bg-primary" aria-hidden />
                  )}
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <SectionLabel>Tools</SectionLabel>
        <ul className="space-y-0.5">
          {SECONDARY.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-mute hover:bg-background hover:text-foreground"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {"badge" in item && item.badge && (
                    <span className="rounded-full border border-border bg-background px-1.5 font-mono text-[9px] uppercase tracking-wider text-mute">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <PointsBadge />
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-mute/70">
      {children}
    </div>
  );
}
