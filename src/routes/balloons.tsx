import { createFileRoute } from "@tanstack/react-router";
import { BalloonPop } from "@/components/game/BalloonPop";

export const Route = createFileRoute("/balloons")({
  head: () => ({
    meta: [
      { title: "Balloon Pop - Sonny's Games" },
      { name: "description", content: "Pop the right letter balloon with Sonny John." },
    ],
  }),
  component: BalloonPop,
});
