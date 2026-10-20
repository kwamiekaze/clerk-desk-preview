import { createFileRoute } from "@tanstack/react-router";
import { LetterRace } from "@/components/game/LetterRace";

export const Route = createFileRoute("/letters")({
  head: () => ({
    meta: [
      { title: "ABC Race - Sonny's Games" },
      {
        name: "description",
        content: "Find the letters and race the sports car to the finish line.",
      },
    ],
  }),
  component: LetterRace,
});
