import { PromptBuilder } from "./PromptBuilder";
import { BackgroundVideo } from "@/components/fx/BackgroundVideo";
import { MatrixRain } from "@/components/fx/MatrixRain";
import { HERO_VIDEO_URL } from "@/lib/media-constants";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* video background + fallbacks */}
      <BackgroundVideo
        src={HERO_VIDEO_URL}
        className="absolute inset-0 h-full w-full"
        opacity={0.55}
        fallback={
          <>
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-[520px] max-w-5xl bloom-primary opacity-70" aria-hidden />
            <div className="pointer-events-none absolute -right-40 top-40 h-[420px] w-[420px] bloom-secondary opacity-50" aria-hidden />
          </>
        }
      />
      {/* darken video so text stays readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/85"
      />
      {/* MatrixRain composited above the video at low opacity */}
      <MatrixRain className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]" density={1} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
        }}
        aria-hidden
      />


      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[11px] text-mute backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-status-ok animate-cc-pulse-dot" />
              Bureau open · Clerks on duty
            </div>

            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[68px]">
              Your coding desk,{" "}
              <span className="relative">
                <span className="text-primary">staffed by agents.</span>
                <svg
                  className="absolute -bottom-1 left-0 h-2 w-full text-primary/60"
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M0 6 Q 50 0 100 5 T 200 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-mute">
              CodingClerks is a premium agentic bureau that turns a prompt — or any public URL — into a
              working React application. Crawled, drafted, previewed, and shipped to GitHub or Vercel
              while you watch the ledger.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#cta"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open the desk
                <span className="font-mono text-[11px] opacity-70">→</span>
              </a>
              <a
                href="#workflow"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-foreground transition-colors hover:border-border-strong"
              >
                See the workflow
              </a>
              <span className="font-mono text-[11px] text-mute">
                <span className="text-foreground">⌘K</span> to summon a clerk
              </span>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              {[
                ["12s", "first preview"],
                ["1-click", "GitHub export"],
                ["0", "vendor lock-in"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{v}</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight">{k}</dd>
                </div>
              ))}
            </dl>
          </div>

          <PromptBuilder />
        </div>
      </div>
    </section>
  );
}
