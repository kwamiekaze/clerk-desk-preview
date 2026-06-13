import { Wordmark } from "../brand/Wordmark";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Capabilities", href: "#capabilities" },
      { label: "Workflow", href: "#workflow" },
      { label: "Websites", href: "#websites" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Bureau",
    links: [
      { label: "Coding Points", href: "#points" },
      { label: "Security", href: "#security" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm text-mute">
              A coding desk staffed by agents. Prompts and URLs become production-ready React applications,
              with provenance you can audit.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-[11px] text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-status-ok animate-cc-pulse-dot" />
              All systems nominal
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-foreground/85 hover:text-primary">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <div className="font-mono text-[11px] text-mute">
            © {new Date().getFullYear()} CodingClerks Bureau · Desk 01
          </div>
          <div className="flex gap-5 text-[11px] text-mute">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">DPA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
