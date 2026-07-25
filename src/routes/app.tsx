import { useEffect, useState } from "react";
import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/brand/Wordmark";
import { LogOut, LayoutDashboard, FolderKanban, Shield, Loader2 } from "lucide-react";
import { getUsage } from "@/lib/ai/projects.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"user" | "admin">("user");
  const [usage, setUsage] = useState<{ plan: string; buildsUsed: number; buildsCap: number; projectCount: number; projectCap: number } | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchUsage = useServerFn(getUsage);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(data.session.user.email ?? null);
      setLoading(false);
      fetchUsage().then((u) => { if (mounted) { setUsage(u); setRole(u.role as "user" | "admin"); } }).catch(() => {});
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate, fetchUsage]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-5 w-5 animate-spin text-mute" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/app"><Wordmark /></Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/app" active={pathname === "/app"} icon={LayoutDashboard} label="Dashboard" />
            <NavLink to="/app/projects" active={pathname.startsWith("/app/projects")} icon={FolderKanban} label="Projects" />
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
          <span className="hidden font-mono text-[11px] text-mute md:inline">{email}</span>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-mute hover:border-border-strong hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> sign out
          </button>
        </div>
      </header>
      <Outlet />
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
