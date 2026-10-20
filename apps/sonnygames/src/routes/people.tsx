import { createFileRoute } from "@tanstack/react-router";
import { MyPeople } from "@/components/game/MyPeople";

export const Route = createFileRoute("/people")({
  head: () => ({
    meta: [
      { title: "My People - Sonny's Games" },
      { name: "description", content: "Find the people in Sonny John's life." },
    ],
  }),
  component: MyPeople,
});
