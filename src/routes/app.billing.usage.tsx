import { createFileRoute } from "@tanstack/react-router";
import { LedgerTable } from "@/components/billing/LedgerTable";
import { UsageCharts } from "@/components/billing/UsageCharts";

export const Route = createFileRoute("/app/billing/usage")({
  head: () => ({ meta: [{ title: "Usage & ledger — CodingClerks" }] }),
  component: UsagePage,
});

function UsagePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h2 className="mb-3 text-base font-medium tracking-tight">Coding Points ledger</h2>
        <LedgerTable />
      </section>
      <section>
        <h2 className="mb-3 text-base font-medium tracking-tight">Usage breakdown</h2>
        <UsageCharts />
      </section>
    </div>
  );
}
