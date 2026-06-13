import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPanel } from "@/components/settings/PrivacyPanel";

export const Route = createFileRoute("/app/settings/privacy")({
  head: () => ({ meta: [{ title: "Privacy — CodingClerks" }] }),
  component: PrivacyPanel,
});
