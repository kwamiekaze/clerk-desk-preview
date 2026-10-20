import { getProgress } from "./progress";
import { LINES } from "./voice-lines";
import { VOICE_LOCAL, VOICE_URLS } from "./voice-manifest";

// ---------- Voice: pre-recorded human clips (with browser text-to-speech as a backup) ----------
//
// Every clip is a short, tightly-trimmed MP3 (about 10-30 KB). They are fetched once, decoded into
// memory and played through the Web Audio context that the first tap unlocks. That means:
//  - no network wait when a line is spoken (clips are preloaded for each game),
//  - lines chained together (say("a", "b")) play back to back with no gap or click,
//  - a newer line cleanly cuts off an older one,
//  - the browser voice is only used if a clip truly cannot be loaded.

let sayToken = 0;
let activeStop: (() => void) | null = null;

const GAP = 0.05; // seconds of air between chained clips
const LOAD_TIMEOUT = 6000;

const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | null>>();

function clipUrl(key: string): string | null {
  if (VOICE_LOCAL) return `/voice/${key}.mp3`;
  return VOICE_URLS[key] ?? null;
}

function decode(c: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  // Older Safari only understands the callback form.
  return new Promise((resolve, reject) => {
    const p = c.decodeAudioData(data, resolve, reject);
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
}

/** Cut silence off the start and end of a clip so no dead air or trailing noise can play. */
export function trimBuffer(c: BaseAudioContext, buf: AudioBuffer): AudioBuffer {
  const threshold = 0.012;
  const len = buf.length;
  let first = len;
  let last = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      if (Math.abs(d[i] ?? 0) > threshold) {
        if (i < first) first = i;
        break;
      }
    }
    for (let i = len - 1; i >= 0; i--) {
      if (Math.abs(d[i] ?? 0) > threshold) {
        if (i > last) last = i;
        break;
      }
    }
  }
  if (first >= last) return buf; // all quiet: leave alone
  const pad = Math.round(buf.sampleRate * 0.02);
  const from = Math.max(0, first - pad);
  const to = Math.min(len, last + pad * 3);
  if (from === 0 && to === len) return buf;
  const out = c.createBuffer(buf.numberOfChannels, to - from, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    out.getChannelData(ch).set(buf.getChannelData(ch).subarray(from, to));
  }
  return out;
}

function loadClip(key: string): Promise<AudioBuffer | null> {
  const have = buffers.get(key);
  if (have) return Promise.resolve(have);
  const pending = loading.get(key);
  if (pending) return pending;
  const url = clipUrl(key);
  const c = getCtx();
  if (!url || !c) return Promise.resolve(null);
  const job = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = window.setTimeout(() => ctl?.abort(), LOAD_TIMEOUT);
        const res = await fetch(url, { signal: ctl?.signal ?? null });
        window.clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const decoded = await decode(c, await res.arrayBuffer());
        const buf = trimBuffer(c, decoded);
        buffers.set(key, buf);
        return buf;
      } catch {
        await new Promise((r) => window.setTimeout(r, 250));
      }
    }
    return null;
  })().finally(() => loading.delete(key));
  loading.set(key, job);
  return job;
}

function stopCurrent() {
  activeStop?.();
  activeStop = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/**
 * Say one or more recorded lines, one after another (see voice-lines.ts for the keys).
 * A newer call cuts off an older one. If a clip cannot be loaded, the same words are read by the
 * browser voice instead so the game never goes silent.
 */
export async function say(...keys: string[]): Promise<void> {
  if (typeof window === "undefined" || getProgress().muted) return;
  // Test hook: the browser tests read this to see exactly which lines the game asked for.
  (window as unknown as { __sayLog?: string[][] }).__sayLog?.push(keys);
  const token = ++sayToken;
  stopCurrent();
  const c = getCtx();
  if (!c) {
    for (const key of keys) {
      if (token !== sayToken) return;
      const text = LINES[key];
      if (text) await speak(text, { queue: true });
    }
    return;
  }
  if (c.state !== "running") void c.resume().catch(() => undefined);

  // Start every download at once; they are tiny, and usually already in memory.
  const wanted = keys.map((k) => loadClip(k));

  const master = c.createGain();
  master.connect(c.destination);
  const sources: AudioBufferSourceNode[] = [];
  const stop = () => {
    const t = c.currentTime;
    try {
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0, t, 0.01);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => {
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      }
      master.disconnect();
    }, 60);
  };
  activeStop = stop;

  let when = c.currentTime + 0.02;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as string;
    const buf = await Promise.race([
      wanted[i] as Promise<AudioBuffer | null>,
      new Promise<null>((r) => window.setTimeout(() => r(null), LOAD_TIMEOUT)),
    ]);
    if (token !== sayToken) return;
    if (buf) {
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(master);
      const startAt = Math.max(when, c.currentTime + 0.01);
      src.start(startAt);
      sources.push(src);
      when = startAt + buf.duration + GAP;
    } else {
      // Could not load this clip: wait for what is playing, then read the words aloud instead.
      await waitUntil(c, when, token);
      if (token !== sayToken) return;
      const text = LINES[key];
      if (text) await speak(text, { queue: true });
      when = c.currentTime;
    }
  }
  await waitUntil(c, when, token);
  if (token === sayToken && activeStop === stop) {
    activeStop = null;
    window.setTimeout(() => master.disconnect(), 50);
  }
}

function waitUntil(c: AudioContext, when: number, token: number): Promise<void> {
  return new Promise((resolve) => {
    const tick = () => {
      if (token !== sayToken || c.currentTime >= when) resolve();
      else window.setTimeout(tick, Math.min(80, Math.max(10, (when - c.currentTime) * 1000)));
    };
    tick();
  });
}

/** Download clips ahead of time so they play with no pause. Safe to call again and again. */
export function preloadClips(keys: string[]) {
  if (typeof window === "undefined") return;
  const queue = keys.filter((k) => !buffers.has(k) && clipUrl(k));
  let next = 0;
  const worker = async () => {
    while (next < queue.length) {
      const key = queue[next++] as string;
      await loadClip(key);
    }
  };
  // a few at a time so the first thing on screen is never starved
  for (let i = 0; i < 4; i++) void worker();
}

/** Preload every clip whose key starts with one of the prefixes. */
export function preloadPrefixes(...prefixes: string[]) {
  preloadClips(Object.keys(VOICE_URLS).filter((k) => prefixes.some((p) => k.startsWith(p))));
}

/** True once a clip is decoded and ready to play instantly (used by tests). */
export function clipReady(key: string): boolean {
  return buffers.has(key);
}

// ---------- Backup voice (browser text-to-speech) ----------

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang?.toLowerCase().startsWith("en"));
  if (!voices.length) return null;
  const preferred = [
    "samantha",
    "aria",
    "jenny",
    "zira",
    "google us english",
    "karen",
    "moira",
    "serena",
  ];
  for (const p of preferred) {
    const v = voices.find((x) => x.name.toLowerCase().includes(p));
    if (v) return (cachedVoice = v);
  }
  return (cachedVoice = voices.find((v) => v.lang === "en-US") ?? voices[0] ?? null);
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  // Voices load asynchronously in some browsers.
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
  };
}

export function stopSpeaking() {
  sayToken++;
  stopCurrent();
}

/** Say something in a slow, friendly voice. Resolves when finished (or after a safety timeout). */
export function speak(text: string, opts: { queue?: boolean; rate?: number } = {}): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve();
  if (getProgress().muted) return Promise.resolve();
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!opts.queue) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "en-US";
    u.rate = opts.rate ?? 0.85;
    u.pitch = 1.2;
    u.volume = 1;
    const done = () => resolve();
    u.onend = done;
    u.onerror = done;
    window.setTimeout(done, Math.max(2500, text.length * 120));
    synth.speak(u);
  });
}

// ---------- Sound effects (synthesised, no audio files needed) ----------

let ctx: AudioContext | null = null;

/** The one shared audio context (voice and sound effects). Created on first use. */
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      // iPhones silence Web Audio when the ringer switch is off unless the page asks for playback audio.
      const nav = navigator as unknown as { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = "playback";
    }
    return ctx;
  } catch {
    return null;
  }
}

function ac(): AudioContext | null {
  if (getProgress().muted) return null;
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume().catch(() => undefined);
  return c;
}

/** Wake the audio up on the very first tap, key press or touch (browsers require a gesture). */
function installUnlock() {
  if (typeof window === "undefined") return;
  const events = ["pointerdown", "touchend", "keydown", "click"] as const;
  const unlock = () => {
    const c = getCtx();
    if (!c) return;
    void c.resume().catch(() => undefined);
    try {
      const b = c.createBuffer(1, 1, 22050); // a silent blip, the classic iOS wake-up
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch {
      /* ignore */
    }
    if (c.state === "running") for (const e of events) window.removeEventListener(e, unlock, true);
  };
  for (const e of events) window.addEventListener(e, unlock, true);
}
installUnlock();

function tone(
  c: AudioContext,
  {
    freq,
    to,
    start = 0,
    dur = 0.2,
    type = "sine",
    gain = 0.18,
  }: {
    freq: number;
    to?: number;
    start?: number;
    dur?: number;
    type?: OscillatorType;
    gain?: number;
  },
) {
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** Call from a tap so mobile browsers allow audio. */
  unlock() {
    ac();
  },
  tap() {
    const c = ac();
    if (c) tone(c, { freq: 520, to: 780, dur: 0.1, gain: 0.12 });
  },
  correct() {
    const c = ac();
    if (!c) return;
    tone(c, { freq: 784, dur: 0.15 });
    tone(c, { freq: 1175, start: 0.12, dur: 0.25 });
  },
  wrong() {
    const c = ac();
    if (c) tone(c, { freq: 330, to: 220, dur: 0.25, gain: 0.1 });
  },
  /** Vroom! */
  engine() {
    const c = ac();
    if (!c) return;
    tone(c, { freq: 70, to: 380, dur: 0.7, type: "sawtooth", gain: 0.09 });
    tone(c, { freq: 140, to: 760, dur: 0.7, type: "square", gain: 0.03 });
  },
  honk() {
    const c = ac();
    if (!c) return;
    tone(c, { freq: 370, dur: 0.14, type: "square", gain: 0.07 });
    tone(c, { freq: 370, start: 0.2, dur: 0.14, type: "square", gain: 0.07 });
  },
  /** A bubbly "boop" that climbs with each ghost counted. */
  ghost(k = 1) {
    const c = ac();
    if (!c) return;
    const f = 380 + Math.min(k, 10) * 48;
    tone(c, { freq: f, to: f * 1.5, dur: 0.18, type: "sine", gain: 0.16 });
    tone(c, { freq: f * 2, start: 0.05, dur: 0.14, type: "triangle", gain: 0.05 });
  },
  /** Friendly spooky whoosh for the blanket dropping. */
  whoosh() {
    const c = ac();
    if (!c) return;
    tone(c, { freq: 900, to: 160, dur: 0.55, type: "sine", gain: 0.1 });
    tone(c, { freq: 300, to: 90, dur: 0.6, type: "triangle", gain: 0.08 });
  },
  /** Playful "ooOOoo" for a ghost. */
  boo() {
    const c = ac();
    if (!c) return;
    tone(c, { freq: 220, to: 330, dur: 0.35, type: "sine", gain: 0.12 });
    tone(c, { freq: 330, to: 180, start: 0.3, dur: 0.45, type: "sine", gain: 0.12 });
  },
  /** Toot toot! */
  whistle() {
    const c = ac();
    if (!c) return;
    tone(c, { freq: 620, to: 700, dur: 0.35, type: "triangle", gain: 0.12 });
    tone(c, { freq: 780, to: 860, dur: 0.35, type: "triangle", gain: 0.1 });
    tone(c, { freq: 620, start: 0.45, dur: 0.5, type: "triangle", gain: 0.12 });
    tone(c, { freq: 780, start: 0.45, dur: 0.5, type: "triangle", gain: 0.1 });
  },
  /** Chug chug chug. */
  chug(n = 6) {
    const c = ac();
    if (!c) return;
    for (let i = 0; i < n; i++)
      tone(c, { freq: 110, to: 60, start: i * 0.32, dur: 0.14, type: "square", gain: 0.06 });
  },
  /** Clunk of a letter locking onto a car. */
  clunk() {
    const c = ac();
    if (!c) return;
    tone(c, { freq: 180, to: 90, dur: 0.14, type: "square", gain: 0.1 });
    tone(c, { freq: 900, start: 0.08, dur: 0.12, type: "triangle", gain: 0.08 });
  },
  cheer() {
    const c = ac();
    if (!c) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone(c, { freq: f, start: i * 0.1, dur: 0.3, type: "triangle", gain: 0.15 }),
    );
  },
};

/** Pick a random item from a list. */
export function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
