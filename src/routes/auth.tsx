import { useState } from "react";
import { useNavigate, useSearch, createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/Wordmark";
import { mockApi } from "@/lib/mock/service";
import { Github, Mail, Lock, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

type Mode = "signin" | "signup" | "forgot" | "verify" | "oauth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: ((s.mode as Mode) ?? "signin") as Mode,
    email: typeof s.email === "string" ? s.email : "",
  }),
  head: () => ({ meta: [{ title: "Sign in — CodingClerks" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, email: initialEmail } = useSearch({ from: "/auth" });
  const navigate = useNavigate({ from: "/auth" });
  const setMode = (m: Mode, email = "") =>
    navigate({ search: (prev: { mode: Mode; email: string }) => ({ ...prev, mode: m, email: email || prev.email }) });

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-16 h-96 w-96 bloom-primary opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 bloom-secondary opacity-50" aria-hidden />

        <div className="relative">
          <Link to="/"><Wordmark /></Link>
        </div>

        <div className="relative max-w-md">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            Bureau · Desk 01
          </div>
          <p className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight">
            Sign in to dispatch your clerks. The ledger never sleeps.
          </p>
          <div className="mt-8 rounded-lg border border-border bg-surface/70 p-4 backdrop-blur">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
              Live ledger
            </div>
            <ul className="mt-3 space-y-2 font-mono text-[12px]">
              {[
                ["00:02", "intake", "Brief parsed"],
                ["00:06", "engineer", "Routes wired"],
                ["00:12", "preview", "Sandbox live"],
              ].map(([t, c, m]) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="text-mute">{t}</span>
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-ok" />
                    {c}
                  </span>
                  <span className="text-mute">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative font-mono text-[11px] text-mute">© CodingClerks Bureau</div>
      </aside>

      {/* Right: form panel */}
      <main className="relative flex items-center justify-center px-6 py-12">
        <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-30 lg:hidden" aria-hidden />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/"><Wordmark /></Link>
          </div>

          {mode === "signin" && <SignIn onSwitch={setMode} initialEmail={initialEmail} />}
          {mode === "signup" && <SignUp onSwitch={setMode} initialEmail={initialEmail} />}
          {mode === "forgot" && <Forgot onSwitch={setMode} initialEmail={initialEmail} />}
          {mode === "verify" && <Verify email={initialEmail} onSwitch={setMode} />}
          {mode === "oauth" && <OAuthPending onSwitch={setMode} />}
        </div>
      </main>
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────────────── */

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <header className="mb-7">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">{eyebrow}</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mt-2 text-sm text-mute">{sub}</p>}
    </header>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{label}</span>
        {hint}
      </div>
      {children}
    </label>
  );
}

function inputCls() {
  return "w-full rounded-md border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-mute/70 focus:border-primary focus:outline-none";
}

function PrimaryButton({
  children,
  loading,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function GithubButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors hover:border-border-strong"
    >
      <Github className="h-4 w-4" />
      Continue with GitHub
    </button>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/* ── Modes ───────────────────────────────────────────────────── */

function SignIn({ onSwitch, initialEmail }: { onSwitch: (m: Mode, email?: string) => void; initialEmail: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await mockApi.signIn(email, password);
    setLoading(false);
    navigate({ to: "/app" });
  }

  return (
    <>
      <Heading eyebrow="Welcome back" title="Sign in to the bureau" sub="Pick up where your clerks left off." />
      <GithubButton onClick={() => onSwitch("oauth")} />
      <Divider />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className={inputCls()}
            />
          </div>
        </Field>
        <Field
          label="Password"
          hint={
            <button
              type="button"
              onClick={() => onSwitch("forgot", email)}
              className="text-[11px] text-mute hover:text-primary"
            >
              Forgot?
            </button>
          }
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls()}
            />
          </div>
        </Field>
        <PrimaryButton loading={loading}>
          Open the desk
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm text-mute">
        New to CodingClerks?{" "}
        <button onClick={() => onSwitch("signup", email)} className="text-primary hover:underline">
          Create a bureau
        </button>
      </p>
    </>
  );
}

function SignUp({ onSwitch, initialEmail }: { onSwitch: (m: Mode, email?: string) => void; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await mockApi.signUp(email, password);
    setLoading(false);
    onSwitch("verify", email);
  }

  return (
    <>
      <Heading eyebrow="Open a desk" title="Create your bureau" sub="Start with 200 Coding Points on the house." />
      <GithubButton onClick={() => onSwitch("oauth")} />
      <Divider />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className={inputCls()}
            />
          </div>
        </Field>
        <Field label="Password" hint={<span className="text-[11px] text-mute">min 10 chars</span>}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className={inputCls()}
            />
          </div>
        </Field>
        <PrimaryButton loading={loading}>Create bureau</PrimaryButton>
      </form>
      <p className="mt-6 text-center text-xs text-mute">
        By continuing you agree to our <a className="text-foreground hover:underline" href="#">Terms</a> and{" "}
        <a className="text-foreground hover:underline" href="#">Privacy Policy</a>.
      </p>
      <p className="mt-4 text-center text-sm text-mute">
        Already on staff?{" "}
        <button onClick={() => onSwitch("signin", email)} className="text-primary hover:underline">
          Sign in
        </button>
      </p>
    </>
  );
}

function Forgot({ onSwitch, initialEmail }: { onSwitch: (m: Mode, email?: string) => void; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await mockApi.sendReset(email);
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <Heading
          eyebrow="Reset queued"
          title="Check your inbox"
          sub={`We sent a reset link to ${email}. It expires in 30 minutes.`}
        />
        <div className="rounded-md border border-border bg-surface p-4 font-mono text-[12px] text-mute">
          <CheckCircle2 className="mb-2 h-4 w-4 text-primary" />
          mail.dispatch · 250 OK
        </div>
        <button
          onClick={() => onSwitch("signin", email)}
          className="mt-6 text-sm text-primary hover:underline"
        >
          ← Back to sign in
        </button>
      </>
    );
  }

  return (
    <>
      <Heading eyebrow="Recover access" title="Forgot password" sub="We'll send a reset link to your inbox." />
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className={inputCls()}
            />
          </div>
        </Field>
        <PrimaryButton loading={loading}>Send reset link</PrimaryButton>
      </form>
      <button
        onClick={() => onSwitch("signin", email)}
        className="mt-6 text-sm text-mute hover:text-foreground"
      >
        ← Back to sign in
      </button>
    </>
  );
}

function Verify({ email, onSwitch }: { email: string; onSwitch: (m: Mode) => void }) {
  return (
    <>
      <Heading
        eyebrow="One more step"
        title="Verify your email"
        sub={`We sent a confirmation link to ${email || "your inbox"}. Click it to open your desk.`}
      />
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">mail.queue</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-cc-pulse-dot" /> awaiting click
          </span>
        </div>
        <div className="p-4 font-mono text-[12px] text-foreground/90">
          <div className="text-mute">SUBJECT</div>
          <div>Verify your CodingClerks bureau</div>
          <div className="mt-3 text-mute">FROM</div>
          <div>bureau@codingclerks.dev</div>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground hover:border-border-strong">
          Resend email
        </button>
        <button
          onClick={() => onSwitch("signin")}
          className="text-sm text-mute hover:text-foreground"
        >
          Use another account
        </button>
      </div>
    </>
  );
}

function OAuthPending({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  return (
    <>
      <Heading
        eyebrow="GitHub OAuth"
        title="Connecting to GitHub"
        sub="A new tab opened to github.com. Authorize CodingClerks to continue."
      />
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-3">
          <Github className="h-5 w-5 text-foreground" />
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="font-mono text-[12px] text-mute">handshake · waiting on github.com</span>
        </div>
        <ul className="mt-4 space-y-1.5 font-mono text-[11px] text-mute">
          <li>· read public repository metadata</li>
          <li>· write to repositories you select per project</li>
          <li>· no access to private orgs unless granted</li>
        </ul>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => onSwitch("signin")}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground hover:border-border-strong"
        >
          Cancel
        </button>
        <button className="text-sm text-primary hover:underline">Try again</button>
      </div>
    </>
  );
}
