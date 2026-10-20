import { createFileRoute } from "@tanstack/react-router";
import { PhotoMatch } from "@/components/game/MemoryMatch";

export const Route = createFileRoute("/photomatch")({
  head: () => ({
    meta: [
      { title: "Photo Match - Sonny's Games" },
      { name: "description", content: "Match the photos of Sonny John." },
    ],
  }),
  component: PhotoMatch,
});
