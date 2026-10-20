import { createFileRoute } from "@tanstack/react-router";
import { TrafficJam } from "@/components/game/TrafficJam";

export const Route = createFileRoute("/traffic")({
  head: () => ({
    meta: [
      { title: "Traffic Jam - Sonny's Games" },
      { name: "description", content: "Count one color of car in the traffic jam." },
    ],
  }),
  component: TrafficJam,
});
