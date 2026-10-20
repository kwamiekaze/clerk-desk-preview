import { createFileRoute } from "@tanstack/react-router";
import { WhatsMissing } from "@/components/game/MemoryGames";

export const Route = createFileRoute("/missing")({
  head: () => ({
    meta: [
      { title: "What's Missing? - Sonny's Games" },
      { name: "description", content: "Find the missing picture with Sonny John." },
    ],
  }),
  component: WhatsMissing,
});
