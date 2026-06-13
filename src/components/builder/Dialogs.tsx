import { useEffect, type ReactNode } from "react";
import { X, Github, Rocket, History, GitCompare, RotateCcw, GitFork } from "lucide-react";
import type { Version } from "@/lib/mock/builder";

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <button onClick={onClose} className="text-mute hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border bg-background/40 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function GithubDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open} onClose={onClose} title="Export to GitHub"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-mute">Cancel</button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Github className="h-3.5 w-3.5" /> Create repository
          </button>
        </>
      }
    >
      <p className="mb-3 text-xs text-mute">A new private repository will be created under your GitHub account. /* POST /api/integrations/github/export */</p>
      <label className="mb-2 block text-xs">
        <span className="mb-1 block text-mute">Owner</span>
        <select className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm">
          <option>your-handle</option>
          <option>codingclerks-org</option>
        </select>
      </label>
      <label className="block text-xs">
        <span className="mb-1 block text-mute">Repository name</span>
        <input defaultValue="my-codingclerks-app" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
      </label>
      <label className="mt-3 flex items-center gap-2 text-xs text-mute">
        <input type="checkbox" defaultChecked /> Private repository
      </label>
    </Modal>
  );
}

export function VercelDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open} onClose={onClose} title="Deploy to Vercel"
      footer={
        <>
          <button onClick={onClose} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-mute">Cancel</button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Rocket className="h-3.5 w-3.5" /> Deploy
          </button>
        </>
      }
    >
      <p className="mb-3 text-xs text-mute">Deploys the current sandbox build through your Vercel team. /* POST /api/integrations/vercel/deploy */</p>
      <div className="space-y-2 text-xs">
        <Field label="Project name" value="my-codingclerks-app" />
        <Field label="Team" value="personal" />
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
            <input type="radio" name="env" defaultChecked /> Preview
          </label>
          <label className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
            <input type="radio" name="env" /> Production
          </label>
        </div>
      </div>
    </Modal>
  );
}

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Share preview"
      footer={<button onClick={onClose} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs">Done</button>}
    >
      <p className="mb-3 text-xs text-mute">A read-only preview link. Streams reflect the current sandbox build.</p>
      <div className="flex gap-2">
        <input readOnly value="https://preview.codingclerks.dev/p/abc123" className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs" />
        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Copy</button>
      </div>
    </Modal>
  );
}

export function VersionHistoryDialog({ open, onClose, versions }: { open: boolean; onClose: () => void; versions: Version[] }) {
  return (
    <Modal open={open} onClose={onClose} title="Version history"
      footer={<button onClick={onClose} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs">Close</button>}
    >
      <p className="mb-3 inline-flex items-center gap-1 text-xs text-mute"><History className="h-3 w-3" /> Restore, compare, or fork any past build. /* GET /api/projects/:id/versions */</p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {versions.map((v) => (
          <li key={v.id} className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm">{v.label}</div>
              <div className="font-mono text-[10px] text-mute">{new Date(v.at).toLocaleString()} · {v.author} · {v.filesChanged} files · {v.pointsSpent} CP</div>
            </div>
            <div className="flex items-center gap-1">
              <IconAction icon={GitCompare} label="Compare" />
              <IconAction icon={RotateCcw} label="Restore" />
              <IconAction icon={GitFork} label="Fork" />
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-mute">{label}</span>
      <input defaultValue={value} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
    </label>
  );
}

function IconAction({ icon: Icon, label }: { icon: typeof GitCompare; label: string }) {
  return (
    <button title={label} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-mute hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
