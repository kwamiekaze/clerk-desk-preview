const ITEMS = [
  {
    q: "How does rollover work?",
    a: "Unspent monthly CP rolls into a separate Rollover bucket while you stay subscribed. It is valid for one additional billing cycle and is spent after monthly CP but before purchased CP.",
  },
  {
    q: "What's the spending order?",
    a: "Daily CP → promotional CP → monthly CP → rollover CP → purchased CP. The most-expiring points always burn first so your purchased balance lasts.",
  },
  {
    q: "What happens when I cancel?",
    a: "You keep full access until the end of the paid billing period. Monthly and rollover CP expire at the end of that period. Purchased top-up CP remains valid for 12 months from the latest purchase, regardless of subscription status.",
  },
  {
    q: "When do points expire?",
    a: "Daily CP resets at midnight UTC and does not roll over. Monthly CP expires at the next renewal. Rollover CP expires after one additional cycle. Promotional CP expires per offer terms. Purchased CP is valid for 12 months from the latest top-up.",
  },
  {
    q: "What if a provider request fails?",
    a: "If a provider fails before producing useful output you are charged 0 CP. Cancelled requests are also free. Successful partial results are charged only for the completed portion and labeled accordingly.",
  },
  {
    q: "How are charges priced?",
    a: "Each request is priced by measured complexity, not raw tokens. A small edit may cost ~0.5 CP, a focused feature 1–1.5 CP, a full landing page 2–3 CP. You see an estimated range before generation and the final fractional charge afterward.",
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
