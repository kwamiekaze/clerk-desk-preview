import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePanel } from "@/components/settings/WorkspacePanel";

export const Route = createFileRoute("/app/settings/workspace")({
  head: () => ({ meta: [{ title: "Workspace — CodingClerks" }] }),
  component: WorkspacePanel,
});
