import { useState } from "react";
import { Wordmark } from "../brand/Wordmark";

const NAV = [
  { label: "Product", href: "#capabilities" },
  { label: "Workflow", href: "#workflow" },
  { label: "Websites", href: "#websites" },
  { label: "Points", href: "#points" },
  { label: "Pricing", href: "#pricing" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center" aria-label="CodingClerks home">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-sm text-mute transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/auth"
            className="rounded-md px-3 py-1.5 text-sm text-mute transition-colors hover:text-foreground"
          >
            Sign in
          </a>
          <a
            href="/auth?mode=signup"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open desk
            <span className="font-mono text-[11px] opacity-70">↵</span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-border bg-surface md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-mute hover:bg-surface-2 hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <a
                href="#cta"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-border px-3 py-2 text-center text-sm text-foreground"
              >
                Sign in
              </a>
              <a
                href="#cta"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                Open desk
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
