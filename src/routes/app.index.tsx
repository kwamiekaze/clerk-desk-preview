import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { OnboardingChecklist } from "@/components/app/OnboardingChecklist";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { ProjectCard } from "@/components/app/ProjectCard";
import { CardSkeleton, FirstProjectState } from "@/components/app/States";
import { mockApi } from "@/lib/mock/service";
import type { ActivityEvent, Project } from "@/lib/mock/types";
import { ArrowUpRight, GitBranch, Gauge, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — CodingClerks" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const empty = !loading && projects.length === 0;

  useEffect(() => {
    let alive = true;
    Promise.all([mockApi.getRecentProjects(4), mockApi.getRecentActivity(6)]).then(
      ([p, e]) => {
        if (!alive) return;
        setProjects(p);
        setEvents(e);
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell
      eyebrow="Desk · overview"
      title="Welcome back, Avery"
      actions={
        <Link
          to="/app/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New project
        </Link>
      }
    >
      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Sparkles} label="Active projects" value="4" delta="+1 this week" />
        <Stat icon={Gauge} label="CP this month" value="582" delta="of 3,000" />
        <Stat icon={GitBranch} label="Repos connected" value="3" delta="github.com/nightowl" />
        <Stat icon={ArrowUpRight} label="Avg. preview time" value="11s" delta="−18% vs. last week" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <OnboardingChecklist />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium tracking-tight">Recent projects</h2>
              <Link to="/app/projects" className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : empty ? (
              <FirstProjectState />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            )}
          </section>
        </div>

        <aside>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium tracking-tight">Activity ledger</h2>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-status-ok animate-cc-pulse-dot" />
              streaming
            </span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <ActivityFeed events={events} />
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">{label}</span>
        <Icon className="h-3.5 w-3.5 text-mute" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 font-mono text-[11px] text-mute">{delta}</div>
    </div>
  );
}
