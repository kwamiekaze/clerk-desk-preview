import { createFileRoute } from "@tanstack/react-router";
import { Opposites } from "@/components/game/VocabGames";

export const Route = createFileRoute("/opposites")({
  head: () => ({
    meta: [
      { title: "Opposites - Sonny's Games" },
      { name: "description", content: "Learn opposites with Sonny John." },
    ],
  }),
  component: Opposites,
});
