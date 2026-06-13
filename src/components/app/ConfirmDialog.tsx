import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border-strong bg-popover shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-md text-mute hover:bg-surface-2 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6">
          <div className={`grid h-10 w-10 place-items-center rounded-full ${destructive ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1.5 text-sm text-mute">{description}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-surface/40 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:border-border-strong"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
