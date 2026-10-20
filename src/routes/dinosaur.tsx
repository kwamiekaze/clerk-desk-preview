import { createFileRoute } from "@tanstack/react-router";
import { ThemeCounting } from "@/components/game/ThemeCounting";
import { COUNTING_THEMES } from "@/lib/counting-themes";

export const Route = createFileRoute("/dinosaur")({
  head: () => ({
    meta: [
      { title: "Dinosaur Dig - Sonny's Games" },
      {
        name: "description",
        content: "Count dinosaurs, eggs, fossils, footprints and leaves with Sonny John.",
      },
    ],
  }),
  component: () => <ThemeCounting theme={COUNTING_THEMES.dinosaur} />,
});
