import { createFileRoute } from "@tanstack/react-router";
import { PlaneGame } from "@/components/game/PlaneGame";

export const Route = createFileRoute("/plane")({
  head: () => ({
    meta: [
      { title: "Sky Pilot - Sonny's Games" },
      { name: "description", content: "Fly the plane through the right ring with Sonny John." },
    ],
  }),
  component: PlaneGame,
});
