import { useEffect, useState } from "react";
import { Code2, GitCompare, Loader2 } from "lucide-react";
import { builderApi, type FileBlob } from "@/lib/mock/builder";

export function CodeView({ projectId, path }: { projectId: string; path: string | null }) {
  const [blob, setBlob] = useState<FileBlob | null>(null);
  const [mode, setMode] = useState<"code" | "diff">("code");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) { setBlob(null); return; }
    setLoading(true);
    builderApi.readFile(projectId, path).then((b) => { setBlob(b); setLoading(false); });
  }, [projectId, path]);

  if (!path) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-mute">
        Select a file to inspect its source or diff.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface/40 px-3 py-2">
        <div className="truncate font-mono text-xs text-foreground/80">{path}</div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
          <TabBtn active={mode === "code"} onClick={() => setMode("code")} icon={Code2} label="Source" />
          <TabBtn active={mode === "diff"} onClick={() => setMode("diff")} icon={GitCompare} label="Diff" disabled={!blob?.diff} />
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-background">
        {loading ? (
          <div className="flex h-full items-center justify-center text-mute"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : mode === "code" ? (
          <pre className="m-0 p-3 font-mono text-[11.5px] leading-5 text-foreground/85"><code>{blob?.content}</code></pre>
        ) : (
          <DiffView hunks={blob?.diff?.hunks ?? []} />
        )}
      </div>
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick, disabled }: { icon: typeof Code2; label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[10px] disabled:opacity-40 ${active ? "bg-surface text-foreground" : "text-mute hover:text-foreground"}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function DiffView({ hunks }: { hunks: { header: string; lines: { kind: "ctx" | "add" | "del"; text: string }[] }[] }) {
  if (hunks.length === 0) return <div className="p-3 font-mono text-[11px] text-mute">No diff for this file.</div>;
  return (
    <div className="font-mono text-[11.5px] leading-5">
      {hunks.map((h, i) => (
        <div key={i}>
          <div className="bg-surface/60 px-3 py-1 text-secondary">{h.header}</div>
          {h.lines.map((l, j) => (
            <div
              key={j}
              className={`px-3 ${l.kind === "add" ? "bg-status-ok/10 text-foreground" : l.kind === "del" ? "bg-destructive/10 text-foreground/70" : "text-foreground/70"}`}
            >
              <span className="mr-2 text-mute">{l.kind === "add" ? "+" : l.kind === "del" ? "−" : " "}</span>
              {l.text || "\u00A0"}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
