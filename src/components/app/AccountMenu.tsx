import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User2, Keyboard, ChevronDown } from "lucide-react";
import { mockApi } from "@/lib/mock/service";
import type { Account } from "@/lib/mock/types";

export function AccountMenu() {
  const [acc, setAcc] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    mockApi.getAccount().then(setAcc);
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
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 text-left hover:border-border-strong"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 font-mono text-[10px] font-semibold text-primary">
          {acc?.initials ?? "—"}
        </span>
        <span className="hidden sm:block">
          <span className="block max-w-[120px] truncate text-sm text-foreground">{acc?.name ?? "—"}</span>
          <span className="block font-mono text-[10px] uppercase tracking-wider text-mute">{acc?.role ?? ""}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-mute" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-md border border-border-strong bg-popover shadow-xl">
          <div className="border-b border-border p-3">
            <div className="text-sm text-foreground">{acc?.name}</div>
            <div className="font-mono text-[11px] text-mute">{acc?.email}</div>
          </div>
          <ul className="py-1">
            {[
              { icon: User2, label: "Account profile" },
              { icon: Settings, label: "Workspace settings" },
              { icon: Keyboard, label: "Shortcuts", k: "⌘K" },
            ].map((i) => {
              const Icon = i.icon;
              return (
                <li key={i.label}>
                  <button className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-2">
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-mute" />
                      {i.label}
                    </span>
                    {"k" in i && i.k && (
                      <span className="font-mono text-[10px] text-mute">{i.k}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border p-1">
            <Link
              to="/auth"
              onClick={() => navigate({ to: "/auth" })}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-surface-2"
            >
              <LogOut className="h-3.5 w-3.5 text-mute" />
              Sign out
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
