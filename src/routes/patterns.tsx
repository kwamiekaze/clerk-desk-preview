import { createFileRoute } from "@tanstack/react-router";
import { PatternParade } from "@/components/game/PatternParade";

export const Route = createFileRoute("/patterns")({
  head: () => ({
    meta: [
      { title: "Pattern Parade - Sonny's Games" },
      { name: "description", content: "Finish the colour patterns with Sonny John." },
    ],
  }),
  component: PatternParade,
});

