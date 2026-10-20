import { createFileRoute } from "@tanstack/react-router";
import { GhostGame } from "@/components/game/GhostGame";

export const Route = createFileRoute("/ghosts")({
  head: () => ({
    meta: [
      { title: "Ghost Game - Sonny's Games" },
      { name: "description", content: "Count, add and take away friendly ghosts with Sonny John." },
    ],
  }),
  component: GhostGame,
});
