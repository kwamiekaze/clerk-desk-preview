import { createFileRoute } from "@tanstack/react-router";
import { SortSafari } from "@/components/game/VocabGames";

export const Route = createFileRoute("/safari")({
  head: () => ({
    meta: [
      { title: "Sort Safari - Sonny's Games" },
      { name: "description", content: "Sort animals, food, vehicles and more with Sonny John." },
    ],
  }),
  component: SortSafari,
});
