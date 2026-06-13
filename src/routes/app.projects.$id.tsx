import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { InitProgress } from "@/components/app/InitProgress";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/projects/$id")({
  validateSearch: (s: Record<string, unknown>) => ({
    init: s.init === 1 || s.init === "1" ? 1 : 0,
  }),
  head: () => ({ meta: [{ title: "Project — CodingClerks" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { init } = Route.useSearch();

  return (
    <AppShell
      eyebrow="Project"
      title={init ? "Initializing project" : id}
      actions={
        <nav className="flex items-center gap-1 font-mono text-[11px] text-mute">
          <Link to="/app/projects" className="hover:text-foreground">Projects</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{id}</span>
        </nav>
      }
    >
      {init ? (
        <InitProgress projectId={id} />
      ) : (
        <div className="rounded-xl border border-border bg-surface p-8 text-sm text-mute">
          Project detail surface lives here. (Phase 3.)
        </div>
      )}
    </AppShell>
  );
}
