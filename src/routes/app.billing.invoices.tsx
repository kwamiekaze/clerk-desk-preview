import { createFileRoute } from "@tanstack/react-router";
import { InvoiceList } from "@/components/billing/InvoiceList";

export const Route = createFileRoute("/app/billing/invoices")({
  head: () => ({ meta: [{ title: "Invoices — CodingClerks" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  return (
    <section>
      <h2 className="mb-3 text-base font-medium tracking-tight">Invoice history</h2>
      <p className="mb-4 text-xs text-mute">
        Invoices are issued by Stripe. Click any row to open the hosted invoice or download a PDF.
      </p>
      <InvoiceList />
    </section>
  );
}
