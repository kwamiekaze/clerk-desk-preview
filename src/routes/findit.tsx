import { createFileRoute } from "@tanstack/react-router";
import { FindIt } from "@/components/game/FindIt";

export const Route = createFileRoute("/findit")({
  head: () => ({
    meta: [
      { title: "Find It on Sonny - Sonny's Games" },
      { name: "description", content: "Find things in Sonny's photos." },
    ],
  }),
  component: FindIt,
});
