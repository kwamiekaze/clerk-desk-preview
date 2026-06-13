import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { NewProjectForm } from "@/components/app/NewProjectForm";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/projects/new")({
  head: () => ({ meta: [{ title: "New project — CodingClerks" }] }),
  component: NewProjectPage,
});

function NewProjectPage() {
  return (
    <AppShell
      eyebrow="Dispatch"
      title="New project"
      actions={
        <nav className="flex items-center gap-1 font-mono text-[11px] text-mute">
          <Link to="/app/projects" className="hover:text-foreground">Projects</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">New</span>
        </nav>
      }
    >
      <NewProjectForm />
    </AppShell>
  );
}
