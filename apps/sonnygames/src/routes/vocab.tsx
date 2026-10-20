import { createFileRoute } from "@tanstack/react-router";
import { PictureWords } from "@/components/game/VocabGames";

export const Route = createFileRoute("/vocab")({
  head: () => ({
    meta: [
      { title: "Picture Words - Sonny's Games" },
      { name: "description", content: "Find the picture for each word with Sonny John." },
    ],
  }),
  component: PictureWords,
});
