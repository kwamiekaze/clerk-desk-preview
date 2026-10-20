import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  maxCountNumber,
  unlockedLetterCount,
  unlockedPeopleCount,
  unlockedWordCount,
} from "@/lib/adaptive";
import { stopSpeaking } from "@/lib/audio";
import { LETTERS, PEOPLE, WORDS } from "@/lib/content";
import { resetProgress, setMuted, setStars, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** Hidden "grown-ups" corner: press and hold the lock to see progress or reset. */
export function ParentPanel() {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const p = useProgress();

  const startHold = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      setOpen(true);
    }, 1200);
  };
  const cancelHold = () => {
    setHolding(false);
    if (timer.current) window.clearTimeout(timer.current);
  };

  const unlocked = unlockedLetterCount(p.letters);
  const knownLetters = LETTERS.filter((l) => (p.letters[l.letter] ?? 0) >= 3).length;
  const knownWords = WORDS.filter((w) => (p.words[w.word] ?? 0) >= 2).length;

  return (
    <>
      <button
        type="button"
        aria-label="Grown-ups: press and hold"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-sky-900/70 shadow transition",
          holding && "scale-110 bg-amber-200",
        )}
      >
        🔒 Grown-ups (hold)
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setConfirmReset(false);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Sonny John's progress</DialogTitle>
            <DialogDescription>
              The games get a little harder as Sonny gets answers right on the first try, and repeat
              the things he finds tricky.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Stars" value={p.stars} />
            <Stat label="Games played" value={p.rounds} />
            <Stat label="Count up to" value={maxCountNumber(p.counting)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium">Fix star total (cars unlock from stars)</span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                aria-label="One fewer star"
                onClick={() => setStars(p.stars - 1)}
                className="grid size-9 place-items-center rounded-full border text-xl font-bold"
              >
                −
              </button>
              <span className="w-8 text-center font-bold">{p.stars}</span>
              <button
                type="button"
                aria-label="One more star"
                onClick={() => setStars(p.stars + 1)}
                className="grid size-9 place-items-center rounded-full border text-xl font-bold"
              >
                +
              </button>
            </span>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">
              Letters: {knownLetters} known, {unlocked} in play
            </h3>
            <div className="grid grid-cols-9 gap-1">
              {LETTERS.map((l, i) => {
                const m = p.letters[l.letter] ?? 0;
                const inPlay = i < unlocked;
                return (
                  <div
                    key={l.letter}
                    title={`${l.letter}: ${m}/5`}
                    className={cn(
                      "grid aspect-square place-items-center rounded-md text-sm font-bold",
                      !inPlay && "bg-muted text-muted-foreground",
                      inPlay && m === 0 && "bg-amber-100 text-amber-900",
                      inPlay && m > 0 && m < 3 && "bg-lime-200 text-lime-900",
                      inPlay && m >= 3 && "bg-green-500 text-white",
                    )}
                  >
                    {l.letter}
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Grey = not introduced yet, yellow = new, light green = learning, green = known.
            </p>
          </div>

          <p className="text-sm">
            Counting games: Parking Lot up to {maxCountNumber(p.parking)}, More Cars up to{" "}
            {maxCountNumber(p.compare)}, Traffic Jam up to {maxCountNumber(p.traffic)}.
          </p>

          <p className="text-sm">
            My People: {unlockedPeopleCount(p.people)} of {PEOPLE.length} people in play.
          </p>

          <p className="text-sm">
            Words: {knownWords} known, {unlockedWordCount(p.words)} of {WORDS.length} in play.
          </p>

          <label className="flex items-center justify-between rounded-lg border p-3">
            <span className="font-medium">Voice and sounds</span>
            <Switch
              checked={!p.muted}
              onCheckedChange={(on) => {
                if (!on) stopSpeaking();
                setMuted(!on);
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true);
              resetProgress();
              setConfirmReset(false);
              setOpen(false);
            }}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-semibold",
              confirmReset ? "border-red-500 bg-red-500 text-white" : "text-red-600",
            )}
          >
            {confirmReset ? "Tap again to erase all progress" : "Reset progress"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
