import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { mockApi } from "@/lib/mock/service";
import type { Workspace } from "@/lib/mock/types";

export function WorkspaceSelector() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [current, setCurrent] = useState<Workspace | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mockApi.listWorkspaces().then((ws) => {
      setWorkspaces(ws);
      setCurrent(ws[0]);
    });
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left text-sm hover:border-border-strong"
      >
        <span className="flex items-center gap-2 truncate">
          <WorkspaceMark workspace={current} />
          <span className="truncate">
            <span className="block truncate text-foreground">{current?.name ?? "—"}</span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-mute">
              {current?.plan ?? ""}
            </span>
          </span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-mute" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-md border border-border-strong bg-popover shadow-xl">
          <ul className="max-h-64 overflow-y-auto py-1">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrent(ws);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <WorkspaceMark workspace={ws} />
                  <span className="flex-1 truncate">
                    <span className="block truncate text-foreground">{ws.name}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-mute">
                      {ws.plan} · {ws.seats} seat{ws.seats > 1 ? "s" : ""}
                    </span>
                  </span>
                  {current?.id === ws.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t border-border px-2.5 py-2 text-left text-sm text-mute hover:bg-surface-2 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            New workspace
          </button>
        </div>
      )}
    </div>
  );
}

function WorkspaceMark({ workspace }: { workspace: Workspace | null }) {
  if (!workspace) return <span className="h-7 w-7 rounded-md bg-surface-2" />;
  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-md font-mono text-[10px] font-semibold ${
        workspace.accent === "primary"
          ? "bg-primary/15 text-primary"
          : "bg-secondary/20 text-secondary"
      }`}
    >
      {workspace.initials}
    </span>
  );
}
