import { createFileRoute } from "@tanstack/react-router";
import { WordGarage } from "@/components/game/WordGarage";

export const Route = createFileRoute("/goalspell")({
  head: () => ({
    meta: [
      { title: "Goal Spell - Sonny's Games" },
      { name: "description", content: "Spell words with soccer balls with Sonny John and Rome." },
    ],
  }),
  component: () => <WordGarage skin="soccer" />,
});

