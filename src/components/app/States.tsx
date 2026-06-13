/** Skeleton, empty, error, offline state primitives. */
import { Link } from "@tanstack/react-router";
import { AlertTriangle, FolderOpen, PlusSquare, WifiOff, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-2 ${className}`}
      style={{ animationDuration: "1.4s" }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <SkeletonLine className="h-24 w-full" />
      <SkeletonLine className="mt-3 h-3 w-2/3" />
      <SkeletonLine className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function StateFrame({
  icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "warn" | "ok";
}) {
  const ring =
    tone === "warn"
      ? "border-destructive/40 bg-destructive/5"
      : tone === "ok"
      ? "border-primary/40 bg-primary/5"
      : "border-border bg-surface";
  return (
    <div className={`rounded-xl border ${ring} px-6 py-10 text-center`}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-background text-mute">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-mute">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyProjects() {
  return (
    <StateFrame
      icon={<FolderOpen className="h-5 w-5" />}
      title="No projects in this folder"
      description="Dispatch a brief or paste a URL to fill this drawer with work."
      action={
        <Link
          to="/app/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusSquare className="h-4 w-4" />
          New project
        </Link>
      }
    />
  );
}

export function FirstProjectState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-surface p-8 sm:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 bloom-primary opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-30" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            First dispatch
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your desk is set. Send the clerks something to build.
          </h2>
          <p className="mt-3 max-w-md text-sm text-mute">
            Submit a written brief or paste a public URL. We'll scaffold, preview, and stand by for review.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/app/projects/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <PlusSquare className="h-4 w-4" />
              Dispatch first project
            </Link>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm hover:border-border-strong"
            >
              View example briefs
            </a>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
            What a brief looks like
          </div>
          <pre className="mt-3 whitespace-pre-wrap font-mono text-[12px] text-foreground/90">
{`name: Aurora pricing
intent: marketing
brief: |
  Three pricing tiers (Free, Team, Business),
  monthly/annual toggle, dark editorial theme,
  comparison table, FAQ. Vercel deploy.`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <StateFrame
      tone="warn"
      icon={<WifiOff className="h-5 w-5 text-destructive" />}
      title="You're offline"
      description="The bureau lost contact. Check your connection — we'll resume from the last checkpoint."
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:border-border-strong"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )
      }
    />
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <StateFrame
      tone="warn"
      icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
      title="Something went sideways"
      description={message ?? "A clerk could not complete the request. The ledger has the trail."}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-sm hover:border-border-strong"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )
      }
    />
  );
}
