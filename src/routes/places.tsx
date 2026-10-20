import { createFileRoute } from "@tanstack/react-router";
import { HomeTown } from "@/components/game/VocabGames";

export const Route = createFileRoute("/places")({
  head: () => ({
    meta: [
      { title: "Home & Town - Sonny's Games" },
      { name: "description", content: "Learn rooms and places around town with Sonny John." },
    ],
  }),
  component: HomeTown,
});
