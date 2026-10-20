import { createFileRoute } from "@tanstack/react-router";
import { BoatGame } from "@/components/game/BoatGame";

export const Route = createFileRoute("/boat")({
  head: () => ({
    meta: [
      { title: "Boat Captain - Sonny's Games" },
      { name: "description", content: "Sail the boat, find sea animals and load crates with Sonny John." },
    ],
  }),
  component: BoatGame,
});
