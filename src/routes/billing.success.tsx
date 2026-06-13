import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export const Route = createFileRoute("/billing/success")({
  validateSearch: (s: Record<string, unknown>) => ({ session: (s.session as string) ?? "" }),
  head: () => ({ meta: [{ title: "Payment successful — CodingClerks" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { session } = Route.useSearch();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <Wordmark />
        <div className="mx-auto mt-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/40">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Payment received</h1>
        <p className="mt-2 text-sm text-mute">
          Your subscription is live and Coding Points have been granted. A receipt is on its way to your email.
        </p>
        <div className="mt-4 rounded-md border border-border bg-background/60 p-3 text-left font-mono text-[11px] text-mute">
          Session · {session || "cs_test_mock"}<br />
          Status · paid<br />
          Webhook · verified server-side
        </div>
        <div className="mt-6 flex gap-2">
          <Link to="/app" className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong">
            Open dashboard
          </Link>
          <Link to="/app/billing" className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            View billing
          </Link>
        </div>
      </div>
    </div>
  );
}
