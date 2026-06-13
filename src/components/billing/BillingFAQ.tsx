const ITEMS = [
  {
    q: "How does rollover work?",
    a: "Unspent monthly CP rolls into a separate Rollover bucket at the end of each billing period, up to 1× your monthly grant. Rollover CP expires 60 days after it's deposited and is spent after monthly CP but before purchased CP.",
  },
  {
    q: "What's the spending order?",
    a: "Expiring daily CP → promotional CP → monthly CP → rollover CP → purchased CP. The bureau always burns the most-expiring CP first so your purchased balance lasts.",
  },
  {
    q: "What happens when I cancel?",
    a: "You keep full access until the end of the current period. We won't issue any further grants and rollover CP expires on its existing schedule. Purchased CP never expires regardless of subscription status.",
  },
  {
    q: "When do points expire?",
    a: "Daily CP expires at the end of each day. Monthly CP expires at the next renewal. Promotional CP expires per offer terms. Rollover CP expires 60 days from deposit. Purchased CP does not expire.",
  },
  {
    q: "What if a provider request fails?",
    a: "If an upstream model or tool fails before producing usable output, you are not charged for AI output. You may still see a tiny sandbox or routing fee on the receipt, clearly itemized.",
  },
  {
    q: "How are charges priced?",
    a: "Every request is metered by measured cost (tokens, tool calls, sandbox time, crawl pages, deploy seconds) and the model route. You see an estimated range before generation and an itemized receipt afterward — the server is always the source of truth.",
  },
];

export function BillingFAQ() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {ITEMS.map((it) => (
        <details
          key={it.q}
          className="group rounded-xl border border-border bg-surface p-4 open:border-border-strong"
        >
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium tracking-tight">{it.q}</span>
              <span className="font-mono text-[11px] text-mute transition-transform group-open:rotate-45">+</span>
            </div>
          </summary>
          <p className="mt-2 text-sm text-mute">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
