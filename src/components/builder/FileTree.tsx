import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, File as FileIcon, Folder, Search, Pin, PinOff } from "lucide-react";
import type { FileNode } from "@/lib/mock/builder";

export function FileTree({
  files, selected, onSelect, pinned, onTogglePin,
}: {
  files: FileNode[];
  selected: string | null;
  onSelect: (path: string) => void;
  pinned: string[];
  onTogglePin: (path: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ "src/": true, "src/components/": true });

  const filtered = useMemo(() => {
    if (!q) return files;
    const lc = q.toLowerCase();
    return files.filter((f) => f.path.toLowerCase().includes(lc));
  }, [files, q]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-mute">Files</div>
          <span className="font-mono text-[10px] text-mute">{files.filter((f) => f.kind === "file").length}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
          <Search className="h-3 w-3 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find file…"
            className="w-full bg-transparent text-xs placeholder:text-mute/60 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1 font-mono text-xs">
        {filtered.map((f) => {
          const depth = f.path.split("/").filter(Boolean).length - 1;
          const isPinned = pinned.includes(f.path);
          if (f.kind === "dir") {
            const isOpen = open[f.path] ?? false;
            return (
              <button
                key={f.path}
                onClick={() => setOpen({ ...open, [f.path]: !isOpen })}
                className="flex w-full items-center gap-1 px-2 py-0.5 text-left text-mute hover:bg-surface"
                style={{ paddingLeft: 8 + depth * 12 }}
              >
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Folder className="h-3 w-3" />
                <span>{f.path.split("/").filter(Boolean).pop()}</span>
              </button>
            );
          }
          const parent = f.path.split("/").slice(0, -1).join("/") + "/";
          if (!q && parent !== "" && open[parent] === false) return null;
          return (
            <div
              key={f.path}
              className={`group flex items-center justify-between px-2 py-0.5 hover:bg-surface ${selected === f.path ? "bg-surface text-primary" : "text-foreground/80"}`}
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              <button onClick={() => onSelect(f.path)} className="flex min-w-0 flex-1 items-center gap-1 text-left">
                <FileIcon className="h-3 w-3" />
                <span className="truncate">{f.path.split("/").pop()}</span>
                {f.changed === "added" && <span className="text-status-ok">+</span>}
                {f.changed === "modified" && <span className="text-status-warn">~</span>}
                {f.changed === "deleted" && <span className="text-destructive">−</span>}
              </button>
              <button
                onClick={() => onTogglePin(f.path)}
                className={`opacity-0 group-hover:opacity-100 ${isPinned ? "text-primary opacity-100" : "text-mute"}`}
                title={isPinned ? "Unpin from scope" : "Pin to scope"}
              >
                {isPinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
