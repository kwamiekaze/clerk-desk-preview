import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { SettingsNav } from "@/components/settings/SettingsNav";

export const Route = createFileRoute("/app/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <AppShell eyebrow="Bureau · admin" title="Settings">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start"><SettingsNav /></aside>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </AppShell>
  );
}
