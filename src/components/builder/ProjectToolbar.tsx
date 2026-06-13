import { GitBranch, Share2, Github, Rocket, Loader2, AlertTriangle, CheckCircle2, History } from "lucide-react";
import type { BranchInfo, BuildState } from "@/lib/mock/builder";
import { PointsBadge } from "@/components/app/PointsBadge";

const stateMeta: Record<BuildState, { label: string; tone: string; icon: typeof Loader2 }> = {
  idle:       { label: "Idle",        tone: "text-mute",       icon: CheckCircle2 },
  thinking:   { label: "Thinking",    tone: "text-secondary",  icon: Loader2 },
  streaming:  { label: "Streaming",   tone: "text-primary",    icon: Loader2 },
  installing: { label: "Installing",  tone: "text-primary",    icon: Loader2 },
  validating: { label: "Validating",  tone: "text-secondary",  icon: Loader2 },
  ready:      { label: "Ready",       tone: "text-status-ok",  icon: CheckCircle2 },
  error:      { label: "Error",       tone: "text-destructive",icon: AlertTriangle },
};

export function ProjectToolbar({
  name, branch, state, onShare, onGithub, onDeploy, onHistory,
}: {
  name: string;
  branch: BranchInfo;
  state: BuildState;
  onShare: () => void;
  onGithub: () => void;
  onDeploy: () => void;
  onHistory: () => void;
}) {
  const meta = stateMeta[state];
  const Icon = meta.icon;
  const spinning = state === "thinking" || state === "streaming" || state === "installing" || state === "validating";

  return (
    <div className="flex h-12 items-center justify-between gap-3 border-b border-border bg-surface/60 px-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="truncate font-mono text-sm">{name}</div>
        <button className="hidden items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-mute hover:text-foreground sm:inline-flex">
          <GitBranch className="h-3 w-3" />
          {branch.name}
          {branch.ahead > 0 && <span className="text-primary">↑{branch.ahead}</span>}
          {branch.dirty && <span className="text-status-warn">•</span>}
        </button>
        <div className={`hidden items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] md:inline-flex ${meta.tone}`}>
          <Icon className={`h-3 w-3 ${spinning ? "animate-spin" : ""}`} />
          {meta.label}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <PointsBadge compact />
        <ToolbarButton onClick={onHistory} icon={History} label="History" />
        <ToolbarButton onClick={onShare} icon={Share2} label="Share" />
        <ToolbarButton onClick={onGithub} icon={Github} label="GitHub" />
        <button
          onClick={onDeploy}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Rocket className="h-3.5 w-3.5" /> Deploy
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick }: { icon: typeof Share2; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground hover:bg-surface"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
