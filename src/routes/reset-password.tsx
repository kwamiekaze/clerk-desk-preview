import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/Wordmark";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — CodingClerks" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mismatch) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 420));
    setLoading(false);
    setDone(true);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-2xl bloom-primary opacity-50" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-8"><Link to="/"><Wordmark /></Link></div>

        {done ? (
          <>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Sealed</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Password updated</h1>
            <p className="mt-2 text-sm text-mute">Sign in with your new password to return to the desk.</p>
            <div className="mt-5 rounded-md border border-border bg-surface p-4 font-mono text-[12px] text-mute">
              <CheckCircle2 className="mb-2 h-4 w-4 text-primary" />
              auth.update · 200 OK
            </div>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Recovery</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Set a new password</h1>
            <p className="mt-2 text-sm text-mute">Use a long, unique phrase. Bureau enforces 10+ characters.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {[
                { label: "New password", value: password, set: setPassword },
                { label: "Confirm password", value: confirm, set: setConfirm },
              ].map((f) => (
                <label key={f.label} className="block">
                  <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{f.label}</div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
                    <input
                      type="password"
                      required
                      minLength={10}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full rounded-md border border-border bg-background py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </label>
              ))}
              {mismatch && (
                <p className="text-xs text-destructive">Passwords don't match.</p>
              )}
              <button
                type="submit"
                disabled={loading || mismatch}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
