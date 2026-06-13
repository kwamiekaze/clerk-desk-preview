import { createFileRoute } from "@tanstack/react-router";
import { RoutingPanel } from "@/components/settings/RoutingPanel";

export const Route = createFileRoute("/app/settings/routing")({
  head: () => ({ meta: [{ title: "Model routing — CodingClerks" }] }),
  component: RoutingPanel,
});
