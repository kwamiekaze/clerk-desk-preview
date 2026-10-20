import { createFileRoute } from "@tanstack/react-router";
import { CountCars } from "@/components/game/CountCars";

export const Route = createFileRoute("/count")({
  head: () => ({
    meta: [
      { title: "Count Cars - Sonny's Games" },
      { name: "description", content: "Count the colorful sports cars." },
    ],
  }),
  component: CountCars,
});
