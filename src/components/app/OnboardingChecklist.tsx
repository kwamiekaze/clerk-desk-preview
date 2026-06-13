import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Circle, ChevronRight, X } from "lucide-react";
import { mockApi } from "@/lib/mock/service";
import type { OnboardingStep } from "@/lib/mock/types";

export function OnboardingChecklist() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    mockApi.getOnboarding().then(setSteps);
  }, []);

  if (dismissed) return null;
  const done = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  if (steps.length && done === steps.length) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-surface">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 bloom-primary opacity-40" aria-hidden />
      <header className="relative flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            Onboarding · {done}/{steps.length || 5}
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Get the desk in shape</h2>
        </div>
        <button
          aria-label="Dismiss onboarding"
          onClick={() => setDismissed(true)}
          className="text-mute hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="px-5 pt-3">
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ul className="relative divide-y divide-border px-5 pb-2">
        {steps.map((step) => {
          const Body = (
            <div className="flex items-center gap-3 py-3">
              {step.done ? (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="grid h-6 w-6 place-items-center rounded-full border border-border text-mute">
                  <Circle className="h-2 w-2 fill-current" />
                </span>
              )}
              <div className="flex-1">
                <div
                  className={`text-sm ${
                    step.done ? "text-mute line-through" : "text-foreground"
                  }`}
                >
                  {step.title}
                </div>
                {!step.done && <div className="text-xs text-mute">{step.description}</div>}
              </div>
              {!step.done && <ChevronRight className="h-3.5 w-3.5 text-mute" />}
            </div>
          );
          return (
            <li key={step.id}>
              {step.href ? (
                <Link to={step.href} className="block">{Body}</Link>
              ) : (
                <div>{Body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
