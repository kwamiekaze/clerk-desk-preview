import { createFileRoute } from "@tanstack/react-router";
import { CredentialsPanel } from "@/components/settings/CredentialsPanel";

export const Route = createFileRoute("/app/settings/credentials")({
  head: () => ({ meta: [{ title: "Credentials — CodingClerks" }] }),
  component: CredentialsPanel,
});
