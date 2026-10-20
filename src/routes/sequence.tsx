import { createFileRoute } from "@tanstack/react-router";
import { CopyMe } from "@/components/game/MemoryGames";

export const Route = createFileRoute("/sequence")({
  head: () => ({
    meta: [
      { title: "Copy Me - Sonny's Games" },
      { name: "description", content: "Copy the order of the pictures with Sonny John." },
    ],
  }),
  component: CopyMe,
});
