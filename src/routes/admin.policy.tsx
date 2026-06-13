import { createFileRoute } from "@tanstack/react-router";
import { RoutePolicyEditor } from "@/components/admin/RoutePolicyEditor";

export const Route = createFileRoute("/admin/policy")({
  head: () => ({ meta: [{ title: "Admin · route policy — CodingClerks" }] }),
  component: RoutePolicyEditor,
});
