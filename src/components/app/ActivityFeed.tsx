import type { ActivityEvent } from "@/lib/mock/types";
import { timeAgo } from "@/lib/format";

const dotColor: Record<ActivityEvent["status"], string> = {
  ok: "bg-status-ok",
  run: "bg-status-run animate-cc-pulse-dot",
  warn: "bg-status-warn",
  idle: "bg-status-idle",
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (!events.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-mute">
        Quiet desk. New activity will appear here in real time.
      </div>
    );
  }
  return (
    <ol className="overflow-hidden rounded-lg border border-border bg-surface">
      {events.map((e, i) => (
        <li
          key={e.id}
          className={`grid grid-cols-[80px_1fr_auto] items-center gap-3 px-4 py-3 ${
            i ? "border-t border-border" : ""
          }`}
        >
          <span className="font-mono text-[11px] text-mute">{timeAgo(e.at)}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[11px] text-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor[e.status]}`} />
              {e.clerk}
              <span className="text-mute">·</span>
              <span className="truncate text-mute">{e.projectName}</span>
            </div>
            <div className="mt-0.5 truncate text-sm text-foreground/90">{e.message}</div>
          </div>
          <span className="font-mono text-[11px] text-mute">
            {e.pointsDelta ? `${e.pointsDelta} CP` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
