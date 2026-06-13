import { Check, Minus } from "lucide-react";
import { PLANS, type Cadence, planPrice } from "@/lib/mock/billing";

const ROWS: Array<{ label: string; values: (string | boolean)[] }> = [
  { label: "Monthly CP",           values: ["0",        "20",     "40",     "60"] },
  { label: "Daily CP",             values: ["5",        "5",      "5",      "5"] },
  { label: "Daily cap / month",    values: ["30",       "30",     "60",     "90"] },
  { label: "Rollover",             values: [false,      true,     true,     true] },
  { label: "Private sandboxes",    values: [false,      true,     true,     true] },
  { label: "Vercel deploys",       values: [false,      false,    true,     true] },
  { label: "Workspace seats",      values: ["1",        "1",      "3",      "5"] },
  { label: "Member CP limits",     values: [false,      false,    false,    true] },
  { label: "Priority clerks",      values: [false,      false,    true,     true] },
  { label: "Support",              values: ["Community","Email",  "Email",  "SLA"] },
];

export function PlanComparison({ cadence }: { cadence: Cadence }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 bg-surface px-4 py-4 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
              Compare plans
            </th>
            {PLANS.map((p) => (
              <th key={p.id} className="px-4 py-4 text-left">
                <div className="font-medium tracking-tight">{p.name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-mute">
                  {planPrice(p, cadence) === 0 ? "Free" : `$${planPrice(p, cadence).toFixed(2)}/mo`}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-border last:border-0">
              <td className="sticky left-0 bg-surface px-4 py-3 text-mute">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className="px-4 py-3">
                  {typeof v === "boolean" ? (
                    v ? <Check className="h-4 w-4 text-primary" /> : <Minus className="h-4 w-4 text-mute/60" />
                  ) : (
                    <span className="font-mono text-[12px] text-foreground/90">{v}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
