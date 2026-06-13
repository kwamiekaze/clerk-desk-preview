import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/app/billing")({
  component: BillingLayout,
});

const TABS = [
  { to: "/app/billing", label: "Overview", exact: true },
  { to: "/app/billing/usage", label: "Usage & ledger" },
  { to: "/app/billing/invoices", label: "Invoices" },
  { to: "/app/billing/members", label: "Members" },
] as const;

function BillingLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <AppShell
      eyebrow="Bureau · ledger"
      title="Billing & Coding Points"
      actions={
        <nav className="flex flex-wrap items-center gap-1">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`rounded-md border px-3 py-1.5 text-xs ${
                  active
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-mute hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      }
    >
      <Outlet />
    </AppShell>
  );
}
