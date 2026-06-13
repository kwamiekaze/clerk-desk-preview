/** Tiny helpers shared by the app shell. */
export function timeAgo(iso: string): string {
  const diff = (Date.now() - +new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = Math.floor(diff / 86400);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export const statusLabel = {
  draft: "Draft",
  building: "Building",
  preview: "Preview live",
  deployed: "Deployed",
  archived: "Archived",
} as const;

export const statusDot = {
  draft: "bg-status-idle",
  building: "bg-status-run animate-cc-pulse-dot",
  preview: "bg-status-ok",
  deployed: "bg-status-ok",
  archived: "bg-muted-foreground/40",
} as const;

/** Format Coding Points with up to one decimal (no trailing .0 for integers). */
export function formatCP(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? r.toString() : r.toFixed(1);
}

/** Countdown string toward an ISO timestamp. Short form: "in 4h 12m". */
export function countdownTo(iso: string): string {
  const diff = Math.max(0, +new Date(iso) - Date.now()) / 1000;
  if (diff <= 0) return "now";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
