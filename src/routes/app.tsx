import { useEffect, useState } from "react";
import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand/Wordmark";
import { LogOut, LayoutDashboard, Shield, Loader2, Menu, X, Settings as SettingsIcon, Globe, ExternalLink, Trash2 } from "lucide-react";
import { getUsage } from "@/lib/ai/projects.functions";
import { listMyPublishedSites, unpublishProject } from "@/lib/ai/publish.functions";
import { useServerFn } from "@tanstack/react-start";
import { MatrixRain } from "@/components/fx/MatrixRain";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

type PublishedRow = { id: string; slug: string; project_id: string; updated_at: string; projects: { title: string } };

function AppLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [usage, setUsage] = useState<{ plan: string; buildsUsed: number; buildsCap: number; projectCount: number; projectCap: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [published, setPublished] = useState<PublishedRow[]>([]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchUsage = useServerFn(getUsage);
  const listPublished = useServerFn(listMyPublishedSites);
  const unpublish = useServerFn(unpublishProject);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setEmail(data.session.user.email ?? null);
      setLoading(false);
      fetchUsage().then((u) => { if (mounted) { setUsage(u); setRole(u.role as "user" | "admin"); } }).catch(() => {});
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate, fetchUsage]);

  useEffect(() => {
    if (!menuOpen) return;
    listPublished().then((r) => setPublished(r as PublishedRow[])).catch(() => setPublished([]));
  }, [menuOpen, listPublished]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function onUnpublish(projectId: string) {
    if (!confirm("Unpublish this site?")) return;
    await unpublish({ data: { projectId } });
    setPublished((p) => p.filter((x) => x.project_id !== projectId));
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-5 w-5 animate-spin text-mute" /></div>;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <MatrixRain className="fixed inset-0 z-0 h-full w-full opacity-[0.06]" density={0.7} fadeAlpha={0.14} />
      <div className="relative z-10">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/app"><Wordmark /></Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/app" active={pathname === "/app"} icon={LayoutDashboard} label="Dashboard" />
              {role === "admin" && (
                <NavLink to="/app/admin" active={pathname.startsWith("/app/admin")} icon={Shield} label="Admin" />
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {usage && (
              <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-mute sm:flex">
                <span>{usage.plan}</span>
                <span className="text-border">·</span>
                <span className={usage.buildsUsed >= usage.buildsCap && usage.plan === "free" ? "text-destructive" : ""}>
                  builds {usage.buildsUsed}/{usage.plan === "pro" ? "∞" : usage.buildsCap}
                </span>
              </div>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-mute hover:border-primary/60 hover:text-primary"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>
        <Outlet />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-background/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-sm font-medium">{email}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">{usage?.plan ?? "free"} plan</div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="rounded p-1 text-mute hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <MenuLink to="/app" icon={LayoutDashboard} label="Dashboard" onClick={() => setMenuOpen(false)} />
              <MenuLink to="/app/settings" icon={SettingsIcon} label="Settings" onClick={() => setMenuOpen(false)} />
              {role === "admin" && (
                <MenuLink to="/app/admin" icon={Shield} label="Admin" onClick={() => setMenuOpen(false)} />
              )}
              <div className="mt-4 border-t border-border pt-3">
                <div className="mb-2 px-3 font-mono text-[10px] uppercase tracking-wider text-mute">Published sites</div>
                {published.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-mute">No sites published yet.</div>
                ) : (
                  <ul className="space-y-1">
                    {published.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-surface">
                        <div className="min-w-0">
                          <div className="truncate text-sm">{s.projects?.title}</div>
                          <a href={`/${s.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline">
                            /{s.slug} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <button onClick={() => onUnpublish(s.project_id)} className="rounded p-1 text-mute hover:text-destructive" title="Unpublish">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="border-t border-border p-3">
              <button
                onClick={signOut}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-mute hover:border-destructive/60 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function NavLink({ to, active, icon: Icon, label }: { to: string; active: boolean; icon: typeof LayoutDashboard; label: string }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${active ? "bg-surface text-foreground" : "text-mute hover:text-foreground"}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </Link>
  );
}

function MenuLink({ to, icon: Icon, label, onClick }: { to: string; icon: typeof Globe; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface"
    >
      <Icon className="h-4 w-4 text-primary" /> {label}
    </Link>
  );
}
