import { createFileRoute } from "@tanstack/react-router";
import { ProfilePanel } from "@/components/settings/ProfilePanel";

export const Route = createFileRoute("/app/settings/")({
  head: () => ({ meta: [{ title: "Profile — CodingClerks" }] }),
  component: ProfilePanel,
});
