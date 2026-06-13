import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPanel } from "@/components/settings/NotificationsPanel";

export const Route = createFileRoute("/app/settings/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CodingClerks" }] }),
  component: NotificationsPanel,
});
