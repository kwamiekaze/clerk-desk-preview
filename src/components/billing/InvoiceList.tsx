import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { billingApi, type Invoice } from "@/lib/mock/billing";

export function InvoiceList() {
  const [rows, setRows] = useState<Invoice[]>([]);
  useEffect(() => { billingApi.getInvoices().then(setRows); }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Invoice</th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Date</th>
            <th className="px-4 py-3 text-right font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Amount</th>
            <th className="px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => (
            <tr key={inv.id} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 font-mono text-[12px]">{inv.number}</td>
              <td className="px-4 py-3 text-mute">{new Date(inv.issuedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right font-mono">${inv.amountUsd.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  inv.status === "paid"
                    ? "border-status-ok/40 bg-status-ok/10 text-status-ok"
                    : "border-status-warn/40 bg-status-warn/10 text-status-warn"
                }`}>
                  {inv.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-1">
                  <a href={inv.hostedUrl} className="rounded-md border border-border p-1.5 text-mute hover:text-foreground" aria-label="View invoice">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a href={inv.pdfUrl} className="rounded-md border border-border p-1.5 text-mute hover:text-foreground" aria-label="Download PDF">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
