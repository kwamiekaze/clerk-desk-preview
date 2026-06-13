import { useEffect, useState } from "react";
import { settingsApi, type NotificationChannel, type NotificationKey, type NotificationPrefs } from "@/lib/mock/settings";
import { SettingsCard } from "./_atoms";

const CHANNELS: NotificationChannel[] = ["email", "in_app", "github"];

export function NotificationsPanel() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { settingsApi.getNotifications().then(setPrefs); }, []);
  if (!prefs) return <div className="font-mono text-xs text-mute">Loading…</div>;

  const keys = Object.keys(prefs) as NotificationKey[];

  function toggle(k: NotificationKey, ch: NotificationChannel) {
    const cur = prefs![k].channels;
    const next = cur.includes(ch) ? cur.filter((c) => c !== ch) : [...cur, ch];
    setPrefs({ ...prefs!, [k]: { ...prefs![k], channels: next } });
  }

  return (
    <SettingsCard
      title="Notifications"
      description="Where the bureau pings you. GitHub notifications appear as PR comments."
      footer={
        <button
          disabled={saving}
          onClick={async () => { setSaving(true); await settingsApi.updateNotifications(prefs); setSaving(false); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Event</th>
              {CHANNELS.map((c) => (
                <th key={c} className="py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{c.replace("_", " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k} className="border-b border-border/60 last:border-0">
                <td className="py-3 pr-3">
                  <div className="font-medium tracking-tight">{prefs[k].label}</div>
                  <div className="text-xs text-mute">{prefs[k].description}</div>
                </td>
                {CHANNELS.map((c) => {
                  const on = prefs[k].channels.includes(c);
                  return (
                    <td key={c} className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(k, c)}
                        aria-label={`${prefs[k].label} via ${c}`}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsCard>
  );
}
