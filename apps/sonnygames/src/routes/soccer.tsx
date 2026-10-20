import { createFileRoute } from "@tanstack/react-router";
import { ThemeMath } from "@/components/game/ThemeMath";

export const Route = createFileRoute("/soccer")({
  head: () => ({
    meta: [
      { title: "Soccer Stars - Sonny's Games" },
      {
        name: "description",
        content: "Count, add and compare soccer balls with Sonny John and Rome.",
      },
    ],
  }),
  component: () => <ThemeMath theme="soccer" />,
});

