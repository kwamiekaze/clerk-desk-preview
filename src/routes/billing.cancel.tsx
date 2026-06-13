import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export const Route = createFileRoute("/billing/cancel")({
  head: () => ({ meta: [{ title: "Checkout cancelled — CodingClerks" }] }),
  component: CancelPage,
});

function CancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <Wordmark />
        <div className="mx-auto mt-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/40">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Checkout didn&apos;t complete</h1>
        <p className="mt-2 text-sm text-mute">
          Your card wasn&apos;t charged. You can try again or pick a different plan whenever you&apos;re ready.
        </p>
        <div className="mt-6 flex gap-2">
          <Link to="/app/billing" className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:border-border-strong">
            Back to billing
          </Link>
          <Link to="/pricing" className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}
