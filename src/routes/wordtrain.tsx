import { createFileRoute } from "@tanstack/react-router";
import { WordTrain } from "@/components/game/WordTrain";

export const Route = createFileRoute("/wordtrain")({
  head: () => ({
    meta: [
      { title: "Word Train - Sonny's Games" },
      {
        name: "description",
        content: "Drive the train, pick up letters and spell words with Sonny John.",
      },
    ],
  }),
  component: WordTrain,
});
