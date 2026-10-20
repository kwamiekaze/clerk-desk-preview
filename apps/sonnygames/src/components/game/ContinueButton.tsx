import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { continueWithCode, forgetCode, getSavedCode, resumeSync } from "@/lib/sync";

/** Home-screen "Continue" button: type the save code to pick up Sonny's game on any device. */
export function ContinueButton() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; good: boolean } | null>(null);

  useEffect(() => {
    setSaved(getSavedCode());
    void resumeSync();
  }, []);

  async function go() {
    setBusy(true);
    setMsg(null);
    const r = await continueWithCode(code);
    setBusy(false);
    if (!r.ok) return setMsg({ text: r.error, good: false });
    setSaved(getSavedCode());
    setMsg({
      text: r.created ? "Saved! Use this code on any device." : "Welcome back! Game loaded.",
      good: true,
    });
    window.setTimeout(() => setOpen(false), 1200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setCode(saved ?? "");
          setOpen(true);
        }}
        className="rounded-full bg-white px-5 py-2 text-lg font-extrabold text-sky-800 shadow-lg ring-4 ring-sky-200 active:scale-95 sm:text-2xl"
      >
        ▶ Continue
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Continue where Sonny John left off</DialogTitle>
            <DialogDescription>
              Type Sonny's save code to load his stars and cars on this device. A new code saves
              this device's game so any other device can continue it.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void go();
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Save code"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="rounded-lg border px-4 py-3 text-2xl font-bold"
            />
            <button
              type="submit"
              disabled={busy || code.trim().length < 4}
              className="rounded-lg bg-green-500 px-4 py-3 text-xl font-extrabold text-white disabled:opacity-50"
            >
              {busy ? "Loading…" : "Continue"}
            </button>
            {msg && (
              <p
                className={msg.good ? "font-semibold text-green-700" : "font-semibold text-red-600"}
              >
                {msg.text}
              </p>
            )}
            {saved && (
              <button
                type="button"
                onClick={() => {
                  forgetCode();
                  setSaved(null);
                  setCode("");
                }}
                className="text-sm text-muted-foreground underline"
              >
                Stop saving to "{saved}" on this device
              </button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
