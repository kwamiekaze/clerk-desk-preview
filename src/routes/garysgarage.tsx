import { createFileRoute } from "@tanstack/react-router";
import { GarysGarageFrame } from "@/components/site/GarysGarageFrame";

const TITLE = "Gary's Garage | Honest Auto Repair";
const DESCRIPTION = "Honest repairs. Fair prices. Done right. Oil changes, brakes, tires, and engine repair.";
const URL = "https://codingclerks.com/garysgarage";
const IMAGE = "https://codingclerks.com/garysgarage-og.png";

export const Route = createFileRoute("/garysgarage")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:image", content: IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: IMAGE },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: GarysGaragePage,
});

function GarysGaragePage() {
  return <GarysGarageFrame />;
}
