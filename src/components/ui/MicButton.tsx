import { Mic, MicOff } from "lucide-react";
import { useState } from "react";
import { useVoiceDictation } from "@/hooks/useVoiceDictation";

// Appends dictated speech into the referenced string via setter.
// Interim results are conveyed by prefixing with \u200B; we replace the
// last interim block on each update, then commit finals.
export function MicButton({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [interim, setInterim] = useState("");
  const { listening, supported, toggle } = useVoiceDictation((piece) => {
    if (piece.startsWith("\u200B")) {
      setInterim(piece.slice(1));
    } else {
      // commit final: strip any interim and append clean piece
      setInterim("");
      const base = value.replace(/\s*$/, "");
      onChange((base ? base + " " : "") + piece.trim());
    }
  });

  // When interim changes, reflect it live in the field:
  // append interim after the committed value.
  // Callers should treat this as best-effort UX.
  const showInterim = listening && interim.length > 0;
  const composed = showInterim ? (value ? value + " " : "") + interim : value;
  // Sync interim into onChange only when different, but avoid feedback loops:
  if (showInterim && composed !== value + (value ? " " : "") + interim) {
    // no-op; the parent field already displays `value`. Interim is best shown
    // as a subtle hint; we keep committed text in `value` and hint appended.
  }

  if (!supported) {
    return (
      <button
        type="button"
        title="Voice input isn't supported in this browser"
        disabled
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-mute opacity-50 ${className}`}
      >
        <MicOff className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? "Stop dictation" : "Voice input"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
        listening
          ? "border-red-500/60 bg-red-500/10 text-red-400 animate-cc-pulse-dot"
          : "border-border text-mute hover:border-primary/60 hover:text-primary"
      } ${className}`}
    >
      <Mic className="h-3.5 w-3.5" />
    </button>
  );
}
