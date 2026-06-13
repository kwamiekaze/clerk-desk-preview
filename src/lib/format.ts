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
