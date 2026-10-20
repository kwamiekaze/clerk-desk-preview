import { createFileRoute } from "@tanstack/react-router";
import { MoreCars } from "@/components/game/MoreCars";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More Cars - Sonny's Games" },
      { name: "description", content: "Which side has more cars?" },
    ],
  }),
  component: MoreCars,
});
