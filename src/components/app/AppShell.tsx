import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Search, PlusSquare } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { AccountMenu } from "./AccountMenu";
import { PointsBadge } from "./PointsBadge";

export function AppShell({
  children,
  title,
  eyebrow,
  actions,
}: {
  children: ReactNode;
  title?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <div className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">
          <Sidebar />
        </div>

        <div className="flex min-h-screen flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-3 backdrop-blur-xl sm:px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 md:flex">
                <Search className="h-3.5 w-3.5 text-mute" />
                <input
                  placeholder="Search projects, clerks…"
                  className="w-64 bg-transparent text-sm placeholder:text-mute/70 focus:outline-none"
                />
                <span className="font-mono text-[10px] text-mute">⌘K</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PointsBadge compact />
              <Link
                to="/app/projects/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <PlusSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New project</span>
              </Link>
              <AccountMenu />
            </div>
          </header>

          {/* Page heading */}
          {(title || eyebrow || actions) && (
            <div className="border-b border-border bg-surface/40">
              <div className="flex flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
                <div>
                  {eyebrow && (
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                      {eyebrow}
                    </div>
                  )}
                  {title && (
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                  )}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
              </div>
            </div>
          )}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
