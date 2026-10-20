import { createFileRoute } from "@tanstack/react-router";
import { MemoryMatch } from "@/components/game/MemoryMatch";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Memory Match - Sonny's Games" },
      { name: "description", content: "Match the pictures with Sonny John." },
    ],
  }),
  component: MemoryMatch,
});
