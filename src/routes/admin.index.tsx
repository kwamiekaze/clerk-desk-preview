import { createFileRoute } from "@tanstack/react-router";
import { ControlRoom } from "@/components/admin/ControlRoom";
import { AlertsPanel } from "@/components/admin/AlertsPanel";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Control room — CodingClerks" }] }),
  component: AdminHome,
});

function AdminHome() {
  return (
    <div className="space-y-8">
      <ControlRoom />
      <AlertsPanel />
    </div>
  );
}
