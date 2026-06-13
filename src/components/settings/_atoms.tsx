import { type ReactNode } from "react";

/** Shared chrome for settings panels. */
export function SettingsCard({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <header className="border-b border-border p-5">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-xs text-mute">{description}</p>}
      </header>
      <div className="p-5">{children}</div>
      {footer && <div className="flex items-center justify-end gap-2 border-t border-border bg-background/40 px-5 py-3">{footer}</div>}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-mute">{hint}</p>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-mute/60 focus:border-primary/50 focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <div className="text-sm">{label}</div>
        {description && <div className="mt-0.5 text-xs text-mute">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
          checked ? "border-primary/60 bg-primary/30" : "border-border bg-surface-2"
        }`}
      >
        <span
          className={`absolute top-0.5 inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
            checked ? "left-[18px] bg-primary" : "left-0.5 bg-mute"
          }`}
        />
      </button>
    </div>
  );
}
