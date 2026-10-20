import { createFileRoute } from "@tanstack/react-router";
import { SonnyGamesFrame } from "@/components/site/SonnyGamesFrame";

export const Route = createFileRoute("/sonnygames")({
  head: () => ({
    meta: [
      { title: "Sonny's Games | CodingClerks" },
      {
        name: "description",
        content: "Sports cars, letters, words, counting, memory games, and more for Sonny John.",
      },
      { property: "og:title", content: "Sonny's Games | CodingClerks" },
      {
        property: "og:description",
        content: "Sports cars, letters, words, counting, memory games, and more for Sonny John.",
      },
      { property: "og:image", content: "https://sonnygames.lovable.app/og.png" },
    ],
  }),
  component: SonnyGamesPage,
});

function SonnyGamesPage() {
  return <SonnyGamesFrame />;
}
