import { useEffect, useState } from "react";
import { adminApi, type FinanceSnapshot, type CogsSnapshot, type MarginByRoute, type PointsFlowSnapshot, type GenerationHealth } from "@/lib/mock/admin";
import { StatCard, BarRow, Section } from "./_atoms";
import { DollarSign, TrendingUp, AlertCircle, Activity } from "lucide-react";

export function ControlRoom() {
  const [fin, setFin] = useState<FinanceSnapshot | null>(null);
  const [cogs, setCogs] = useState<CogsSnapshot | null>(null);
  const [margin, setMargin] = useState<MarginByRoute[]>([]);
  const [flow, setFlow] = useState<PointsFlowSnapshot | null>(null);
  const [health, setHealth] = useState<GenerationHealth | null>(null);

  useEffect(() => {
    adminApi.getFinance().then(setFin);
    adminApi.getCogs().then(setCogs);
    adminApi.getMargin().then(setMargin);
    adminApi.getPointsFlow().then(setFlow);
    adminApi.getHealth().then(setHealth);
  }, []);

  if (!fin || !cogs || !flow || !health) return <div className="font-mono text-xs text-mute">Loading control room…</div>;

  const grossUsd = margin.reduce((s, m) => s + m.revenueUsd, 0);
  const cogsUsd = margin.reduce((s, m) => s + m.cogsUsd, 0);
  const grossMarginPct = grossUsd > 0 ? Math.round(((grossUsd - cogsUsd) / grossUsd) * 100) : 0;

  return (
    <div className="space-y-8">
      <Section title="Revenue">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="MRR" value={`$${fin.mrrUsd.toLocaleString()}`} delta={`${fin.mrrDeltaPct > 0 ? "+" : ""}${fin.mrrDeltaPct}% MoM`} icon={<DollarSign className="h-3.5 w-3.5 text-mute" />} />
          <StatCard label="ARR" value={`$${fin.arrUsd.toLocaleString()}`} hint="annualized" />
          <StatCard label="Active subs" value={fin.activeSubscriptions.toLocaleString()} delta={`+${fin.trialingSubscriptions} trialing`} />
          <StatCard label="Net rev · 30d" value={`$${fin.netRevenueUsd30d.toLocaleString()}`} delta={`top-ups $${fin.topupRevenueUsd30d.toLocaleString()} · refunds $${fin.refundsUsd30d}`} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fin.byPlan.map((p) => (
            <div key={p.planId} className="rounded-lg border border-border bg-surface p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">{p.planId}</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">${p.mrrUsd.toLocaleString()}</div>
              <div className="font-mono text-[11px] text-mute">{p.subs.toLocaleString()} subs</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="COGS · last 30 days">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="OpenRouter" value={`$${cogs.openrouterUsd30d.toLocaleString()}`} />
          <StatCard label="Firecrawl" value={`$${cogs.firecrawlUsd30d.toLocaleString()}`} />
          <StatCard label="Sandbox (E2B/Vercel)" value={`$${cogs.sandboxUsd30d.toLocaleString()}`} />
        </div>
        <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Daily spend (14d)</div>
          <CogsBars rows={cogs.byDay} />
        </div>
      </Section>

      <Section title="Gross margin">
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <StatCard label="Overall" value={`${grossMarginPct}%`} delta={`$${(grossUsd - cogsUsd).toLocaleString()} gross profit`} icon={<TrendingUp className="h-3.5 w-3.5 text-mute" />} />
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">By model route</div>
            <ul className="space-y-2.5">
              {margin.map((m) => (
                <BarRow key={m.route} label={m.route} value={m.grossMarginPct} max={100} suffix="%" />
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Coding Points · 30 days">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Issued" value={flow.issued30d.toLocaleString()} />
          <StatCard label="Used" value={flow.used30d.toLocaleString()} />
          <StatCard label="Expired" value={flow.expired30d.toLocaleString()} />
          <StatCard label="Refunded" value={flow.refunded30d.toLocaleString()} />
          <StatCard label="Manual adj." value={flow.adjusted30d.toLocaleString()} icon={<AlertCircle className="h-3.5 w-3.5 text-mute" />} />
        </div>
        <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mute">By bucket · issued vs used</div>
          <ul className="space-y-3">
            {flow.byBucket.map((b) => (
              <li key={b.bucket}>
                <div className="flex items-center justify-between text-sm capitalize">
                  <span>{b.bucket}</span>
                  <span className="font-mono text-[12px] text-mute">{b.used.toLocaleString()} / {b.issued.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${Math.round((b.used / b.issued) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Generation health">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Success" value={`${health.successRatePct}%`} icon={<Activity className="h-3.5 w-3.5 text-mute" />} />
          <StatCard label="Retry rate" value={`${health.retryRatePct}%`} />
          <StatCard label="p50 latency" value={`${(health.p50LatencyMs / 1000).toFixed(2)}s`} />
          <StatCard label="p95 latency" value={`${(health.p95LatencyMs / 1000).toFixed(2)}s`} />
          <StatCard label="CSAT" value={`${health.satisfactionScore}/5`} delta={`${health.runs30d.toLocaleString()} runs`} />
        </div>
      </Section>
    </div>
  );
}

function CogsBars({ rows }: { rows: CogsSnapshot["byDay"] }) {
  const max = Math.max(...rows.map((r) => r.openrouter + r.firecrawl + r.sandbox));
  return (
    <div className="flex h-32 items-end gap-1">
      {rows.map((r) => {
        const total = r.openrouter + r.firecrawl + r.sandbox;
        const h = (n: number) => `${Math.round((n / max) * 100)}%`;
        return (
          <div key={r.date} className="flex flex-1 flex-col-reverse" title={`$${total.toFixed(0)} on ${new Date(r.date).toLocaleDateString()}`}>
            <div style={{ height: h(r.openrouter) }} className="bg-primary/70" />
            <div style={{ height: h(r.firecrawl) }} className="bg-secondary/60" />
            <div style={{ height: h(r.sandbox) }} className="bg-status-warn/60" />
          </div>
        );
      })}
    </div>
  );
}
