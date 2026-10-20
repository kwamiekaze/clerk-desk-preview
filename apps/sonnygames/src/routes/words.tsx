import { createFileRoute } from "@tanstack/react-router";
import { WordGarage } from "@/components/game/WordGarage";

export const Route = createFileRoute("/words")({
  head: () => ({
    meta: [
      { title: "Word Garage - Sonny's Games" },
      { name: "description", content: "Spell fun words with sports cars." },
    ],
  }),
  component: WordGarage,
});
