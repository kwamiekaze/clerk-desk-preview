import { createFileRoute } from "@tanstack/react-router";
import { ThemeMath } from "@/components/game/ThemeMath";

export const Route = createFileRoute("/carshow")({
  head: () => ({
    meta: [
      { title: "Car Show Race - Sonny's Games" },
      { name: "description", content: "Count, add and race sports cars at the car show." },
    ],
  }),
  component: () => <ThemeMath theme="carshow" />,
});

