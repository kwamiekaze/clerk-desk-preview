import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { adminOverview } from "@/lib/ai/projects.functions";
import { Loader2, Users, FolderKanban, Hammer } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin — CodingClerks" }] }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof adminOverview>>;

function AdminPage() {
  const call = useServerFn(adminOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    call().then(setData).catch((e) => setErr((e as Error).message));
  }, [call]);

  if (err) return <div className="mx-auto max-w-2xl p-10 text-center text-sm text-destructive">{err}</div>;
  if (!data) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-mute" /></div>;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Control room</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin overview</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={Users} label="Users" value={data.userCount} />
        <Stat icon={FolderKanban} label="Projects" value={data.projectCount} />
        <Stat icon={Hammer} label="Build events" value={data.buildCount} />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium tracking-tight">Recent users</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-left font-mono text-[10px] uppercase tracking-wider text-mute">
              <tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Plan</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Joined</th></tr>
            </thead>
            <tbody>
              {data.recentUsers.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-[12px]">{u.email ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-[11px] uppercase">{u.plan}</td>
                  <td className="px-3 py-2 font-mono text-[11px] uppercase">{u.role}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-mute">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium tracking-tight">Recent projects</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface/60 text-left font-mono text-[10px] uppercase tracking-wider text-mute">
              <tr><th className="px-3 py-2">Title</th><th className="px-3 py-2">Kind</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Created</th></tr>
            </thead>
            <tbody>
              {data.recentProjects.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2">{p.title}</td>
                  <td className="px-3 py-2 font-mono text-[11px] uppercase">{p.kind}</td>
                  <td className="px-3 py-2 font-mono text-[11px] uppercase">{p.status}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-mute">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider text-mute">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
