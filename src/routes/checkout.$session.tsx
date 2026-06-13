import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";

export const Route = createFileRoute("/checkout/$session")({
  head: () => ({ meta: [{ title: "Redirecting to checkout — CodingClerks" }] }),
  component: CheckoutRedirect,
});

function CheckoutRedirect() {
  const { session } = Route.useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"creating" | "redirecting">("creating");

  useEffect(() => {
    // SERVER CONTRACT: client never creates Stripe sessions directly.
    // The server already returned a hosted Checkout URL; in this mock we
    // simulate the redirect to /billing/success after a brief delay.
    const t1 = setTimeout(() => setPhase("redirecting"), 800);
    const t2 = setTimeout(() => {
      navigate({ to: "/billing/success", search: { session } });
    }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate, session]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        <Wordmark />
        <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
        <h1 className="mt-4 text-lg font-semibold tracking-tight">
          {phase === "creating" ? "Preparing your checkout…" : "Redirecting to Stripe…"}
        </h1>
        <p className="mt-1 text-xs text-mute">
          Session <span className="font-mono">{session}</span>
        </p>
        <div className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[11px] text-mute">
          <ShieldCheck className="h-3 w-3 text-primary" /> secure · stripe-hosted
        </div>
      </div>
    </div>
  );
}
