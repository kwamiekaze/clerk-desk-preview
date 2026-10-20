import { createFileRoute } from "@tanstack/react-router";
import { MyWorld } from "@/components/game/VocabGames";

export const Route = createFileRoute("/world")({
  head: () => ({
    meta: [
      { title: "My World - Sonny's Games" },
      { name: "description", content: "Learn Georgia, USA, Guyana and more with Sonny John." },
    ],
  }),
  component: MyWorld,
});
