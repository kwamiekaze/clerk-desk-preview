import { createFileRoute } from "@tanstack/react-router";
import { MembersPanel } from "@/components/settings/MembersPanel";

export const Route = createFileRoute("/app/settings/members")({
  head: () => ({ meta: [{ title: "Members — CodingClerks" }] }),
  component: MembersPanel,
});
