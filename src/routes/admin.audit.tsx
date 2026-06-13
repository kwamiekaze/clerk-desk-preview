import { createFileRoute } from "@tanstack/react-router";
import { AuditLog } from "@/components/admin/AuditLog";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Admin · audit log — CodingClerks" }] }),
  component: AuditLog,
});
