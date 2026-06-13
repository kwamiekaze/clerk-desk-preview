import { createFileRoute } from "@tanstack/react-router";
import { DangerPanel } from "@/components/settings/DangerPanel";

export const Route = createFileRoute("/app/settings/danger")({
  head: () => ({ meta: [{ title: "Danger zone — CodingClerks" }] }),
  component: DangerPanel,
});
