import { useState, type FormEvent } from "react";
import { useNavigate, createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, Mail, Lock } from "lucide-react";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: (s.mode === "signup" ? "signup" : "signin") as Mode,
  }),
  head: () => ({ meta: [{ title: "Sign in — CodingClerks" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/app" },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/app" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-16 h-96 w-96 bloom-primary opacity-60" aria-hidden />
        <div className="relative">
          <Link to="/"><Wordmark /></Link>
        </div>
        <div className="relative max-w-md">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Bureau · Desk 01</div>
          <p className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight">
            Sign in to dispatch your clerks. The ledger never sleeps.
          </p>
        </div>
        <div className="relative font-mono text-[11px] text-mute">© CodingClerks</div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Link to="/"><Wordmark /></Link></div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignup ? "Open your desk" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-mute">
            {isSignup ? "Create an account to start dispatching builds." : "Welcome back to the bureau."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <Field icon={Mail} type="email" placeholder="you@company.com" value={email} onChange={setEmail} autoComplete="email" required />
            <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} required />
            {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isSignup ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center font-mono text-[11px] text-mute">
            {isSignup ? (
              <>Have an account? <Link to="/auth" search={{ mode: "signin" }} className="text-primary hover:underline">Sign in</Link></>
            ) : (
              <>New here? <Link to="/auth" search={{ mode: "signup" }} className="text-primary hover:underline">Create an account</Link></>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, type, placeholder, value, onChange, ...rest }: {
  icon: typeof Mail; type: string; placeholder: string; value: string; onChange: (v: string) => void;
  autoComplete?: string; required?: boolean; minLength?: number;
}) {
  return (
    <label className="relative block">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...rest}
        className="w-full rounded-md border border-border bg-surface px-9 py-2.5 text-sm outline-none focus:border-primary/60"
      />
    </label>
  );
}
