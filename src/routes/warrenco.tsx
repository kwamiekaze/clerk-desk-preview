import { createFileRoute } from "@tanstack/react-router";
import { WarrenCoFrame } from "@/components/site/WarrenCoFrame";

const TITLE = "Warren Co. | Commercial & Residential Cleaning";
const DESCRIPTION =
  "Walk through our 3D cleaning showroom. Office, home, deep, janitorial, post-construction and move-in/out cleaning. Call 404-655-1395.";
const URL = "https://codingclerks.com/warrenco";
const IMAGE = "https://codingclerks.com/warrenco-og.jpg";
const ICON = "/warrenco-icon.png";

export const Route = createFileRoute("/warrenco")({
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
      { property: "og:image:alt", content: "Warren Co. 3D cleaning showroom" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: IMAGE },
      { name: "theme-color", content: "#2a0d0d" },
    ],
    links: [
      { rel: "canonical", href: URL },
      { rel: "icon", href: ICON, type: "image/png" },
      { rel: "apple-touch-icon", href: "/warrenco-apple-touch-icon.png" },
    ],
  }),
  component: WarrenCoPage,
});

function WarrenCoPage() {
  return <WarrenCoFrame />;
}
