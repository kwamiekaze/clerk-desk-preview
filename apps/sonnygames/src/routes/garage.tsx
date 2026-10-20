import { createFileRoute } from "@tanstack/react-router";
import { MyGarage } from "@/components/game/MyGarage";

export const Route = createFileRoute("/garage")({
  head: () => ({
    meta: [
      { title: "My Cars - Sonny's Games" },
      { name: "description", content: "Collect sports cars with the stars you win." },
    ],
  }),
  component: MyGarage,
});
