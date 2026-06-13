import { Link, useRouterState } from "@tanstack/react-router";
import { User, Building2, Users, KeyRound, Route as RouteIcon, ShieldCheck, Bell, CreditCard, AlertTriangle } from "lucide-react";

const ITEMS: Array<{ to: "/app/settings" | "/app/settings/workspace" | "/app/settings/members" | "/app/settings/credentials" | "/app/settings/routing" | "/app/settings/privacy" | "/app/settings/notifications" | "/app/billing" | "/app/settings/danger"; label: string; icon: typeof User; exact?: boolean; group: string }> = [
  { to: "/app/settings",              label: "Profile",        icon: User,         exact: true, group: "Account" },
  { to: "/app/settings/notifications", label: "Notifications", icon: Bell,                       group: "Account" },
  { to: "/app/settings/workspace",    label: "Workspace",      icon: Building2,                  group: "Workspace" },
  { to: "/app/settings/members",      label: "Members & roles", icon: Users,                     group: "Workspace" },
  { to: "/app/settings/credentials",  label: "Credentials",    icon: KeyRound,                   group: "Workspace" },
  { to: "/app/settings/routing",      label: "Model routing",  icon: RouteIcon,                  group: "Workspace" },
  { to: "/app/settings/privacy",      label: "Privacy & data", icon: ShieldCheck,                group: "Workspace" },
  { to: "/app/billing",               label: "Billing & CP",   icon: CreditCard,                 group: "Workspace" },
  { to: "/app/settings/danger",       label: "Danger zone",    icon: AlertTriangle,              group: "Danger" },
];

export function SettingsNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = Array.from(new Set(ITEMS.map((i) => i.group)));

  return (
    <nav className="rounded-2xl border border-border bg-surface p-2">
      {groups.map((g) => (
        <div key={g} className="mb-2 last:mb-0">
          <div className="px-2.5 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-mute/70">{g}</div>
          <ul className="space-y-0.5">
            {ITEMS.filter((i) => i.group === g).map((item) => {
              const Icon = item.icon;
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      active ? "bg-background text-foreground" : "text-mute hover:bg-background hover:text-foreground"
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1.5 h-5 w-0.5 rounded-r bg-primary" aria-hidden />}
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
