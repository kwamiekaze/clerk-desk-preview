import { createFileRoute } from "@tanstack/react-router";
import { NumberTrain } from "@/components/game/NumberTrain";

export const Route = createFileRoute("/numbers")({
  head: () => ({
    meta: [
      { title: "Number Train - Sonny's Games" },
      {
        name: "description",
        content: "Count, find the missing number and pick bigger or smaller.",
      },
    ],
  }),
  component: NumberTrain,
});

