import { createFileRoute } from "@tanstack/react-router";
import { RhymeTime } from "@/components/game/VocabGames";

export const Route = createFileRoute("/rhymes")({
  head: () => ({
    meta: [
      { title: "Rhyme Time - Sonny's Games" },
      { name: "description", content: "Find the words that rhyme with Sonny John." },
    ],
  }),
  component: RhymeTime,
});
