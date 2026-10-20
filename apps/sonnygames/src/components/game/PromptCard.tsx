import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Big tappable "what to do" card with round progress pills. Tap it to hear the question again. */
export function PromptCard({
  children,
  index,
  total,
  onReplay,
  lead,
}: {
  children: ReactNode;
  index: number;
  total: number;
  onReplay: () => void;
  lead?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {lead}
      <button
        type="button"
        onClick={onReplay}
        aria-label="Say it again"
        className="flex-1 rounded-3xl bg-white/95 p-3 text-left shadow-lg ring-4 ring-amber-200 active:scale-95"
      >
        <div className="flex gap-1.5 pb-1" aria-label={`Question ${index + 1} of ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-2.5 flex-1 rounded-full",
                i < index ? "bg-green-500" : i === index ? "bg-amber-400" : "bg-slate-200",
              )}
            />
          ))}
        </div>
        <p className="flex items-center gap-2 text-xl font-extrabold leading-tight text-sky-900 sm:text-3xl">
          <span aria-hidden>🔊</span>
          <span>{children}</span>
        </p>
      </button>
    </div>
  );
}
