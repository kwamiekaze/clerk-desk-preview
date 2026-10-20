import { createFileRoute } from "@tanstack/react-router";
import { ThemeCounting } from "@/components/game/ThemeCounting";
import { COUNTING_THEMES } from "@/lib/counting-themes";
export const Route = createFileRoute("/sleeping")({
  component: () => <ThemeCounting theme={COUNTING_THEMES.sleeping} />,
});
