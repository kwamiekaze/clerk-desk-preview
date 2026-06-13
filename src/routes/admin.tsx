import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const TABS: Array<{ to: "/admin" | "/admin/users" | "/admin/policy" | "/admin/audit"; label: string; exact?: boolean }> = [
  { to: "/admin",        label: "Control room", exact: true },
  { to: "/admin/users",  label: "Users" },
  { to: "/admin/policy", label: "Route policy" },
  { to: "/admin/audit",  label: "Audit log" },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AppShell
      eyebrow="Bureau · control"
      title="Admin"
      actions={
        <nav className="flex flex-wrap items-center gap-1">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  active ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-mute hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      }
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-status-warn/40 bg-status-warn/5 p-4 text-xs">
        <ShieldAlert className="mt-0.5 h-4 w-4 text-status-warn" />
        <div>
          <div className="font-medium text-foreground">Server-authorized area.</div>
          <p className="mt-0.5 text-mute">
            Every endpoint behind <code className="font-mono">/admin</code> requires a server-issued admin claim
            (e.g. <code className="font-mono">has_role(auth.uid(), 'admin')</code>). Hiding navigation is not authorization.
            All actions are written to the immutable audit log.
          </p>
        </div>
      </div>
      <Outlet />
    </AppShell>
  );
}
