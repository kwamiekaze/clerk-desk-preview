import { supabase } from "@/integrations/supabase/client";
import { getProgress, onProgressCommit, replaceProgress, type Progress } from "./progress";

const CODE_KEY = "sonny-code-v1";

export const normalizeCode = (raw: string) => raw.trim().toLowerCase();

export function getSavedCode(): string | null {
  try {
    return window.localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

function storeCode(code: string | null) {
  try {
    if (code) window.localStorage.setItem(CODE_KEY, code);
    else window.localStorage.removeItem(CODE_KEY);
  } catch {
    // ignore
  }
}

const maxMap = (a: Record<string, number>, b: Record<string, number>) => {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
};

/** Never lose anything: keep the higher star count and the best mastery of each thing. */
export function mergeProgress(local: Progress, cloud: Partial<Progress>): Progress {
  const merged: Progress = { ...local, ...cloud, muted: local.muted };
  merged.stars = Math.max(local.stars, cloud.stars ?? 0);
  merged.rounds = Math.max(local.rounds, cloud.rounds ?? 0);
  for (const b of [
    "letters",
    "words",
    "counting",
    "parking",
    "compare",
    "traffic",
    "people",
    "ghosts",
    "soccer",
    "carshow",
    "numbers",
    "patterns",
    "vocab",
    "sorts",
    "opposites",
    "rhymes",
    "memory",
    "findit",
    "photomatch",
    "rhymematch",
    "balloons",
    "wordtrain",
    "boat",
    "plane",
    "sequence",
    "missing",
    "places",
    "world",
  ] as const) {
    merged[b] = maxMap(local[b], cloud[b] ?? {});
  }
  return merged;
}

export async function pushProgress(code: string, p: Progress = getProgress()) {
  const { error } = await supabase.rpc("save_sonny_progress", {
    p_code: code,
    p_data: p as unknown as never,
  });
  if (error) throw error;
}

async function pull(code: string): Promise<Partial<Progress> | null> {
  const { data, error } = await supabase.rpc("load_sonny_progress", { p_code: code });
  if (error) throw error;
  return (data as Partial<Progress> | null) ?? null;
}

/**
 * Continue with a code. An existing code loads its saved game (merged with whatever is
 * on this device); a brand-new code claims this device's game so other devices can continue it.
 */
export async function continueWithCode(
  raw: string,
): Promise<{ ok: true; created: boolean } | { ok: false; error: string }> {
  const code = normalizeCode(raw);
  if (code.length < 4) return { ok: false, error: "Code needs at least 4 letters or numbers." };
  try {
    const cloud = await pull(code);
    const merged = cloud ? mergeProgress(getProgress(), cloud) : getProgress();
    if (cloud) replaceProgress(merged);
    await pushProgress(code, merged);
    storeCode(code);
    startAutoSave();
    return { ok: true, created: !cloud };
  } catch {
    return { ok: false, error: "Could not reach the save. Check the internet and try again." };
  }
}

export function forgetCode() {
  storeCode(null);
}

let timer: number | undefined;
let unsub: (() => void) | undefined;

/** Save to the cloud (a moment after each change) while a code is in use. */
export function startAutoSave() {
  if (unsub || typeof window === "undefined") return;
  unsub = onProgressCommit((p) => {
    const code = getSavedCode();
    if (!code) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void pushProgress(code, p).catch(() => undefined), 1200);
  });
  window.addEventListener("pagehide", () => {
    const code = getSavedCode();
    if (code) void pushProgress(code).catch(() => undefined);
  });
}

/** On app start: if this device already has a code, catch up with the cloud and keep saving. */
export async function resumeSync() {
  const code = getSavedCode();
  if (!code) return;
  startAutoSave();
  try {
    const cloud = await pull(code);
    if (cloud) {
      const merged = mergeProgress(getProgress(), cloud);
      replaceProgress(merged);
    }
  } catch {
    // offline - keep playing locally; it will sync on the next change
  }
}
