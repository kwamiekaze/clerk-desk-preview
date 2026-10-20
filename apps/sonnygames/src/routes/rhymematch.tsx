import { createFileRoute } from "@tanstack/react-router";
import { RhymeMatch } from "@/components/game/MemoryMatch";

export const Route = createFileRoute("/rhymematch")({
  head: () => ({
    meta: [
      { title: "Rhyme Match - Sonny's Games" },
      { name: "description", content: "Match the words that rhyme with Sonny John." },
    ],
  }),
  component: RhymeMatch,
});
