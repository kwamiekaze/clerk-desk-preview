import { describe, expect, it } from "vitest";
import { LINES } from "@/lib/voice-lines";
import { VOICE_URLS } from "@/lib/voice-manifest";
import { makeSea, SEA_WORDS, seaLevel } from "@/lib/sea";
import { makeSky, skyLevel, SKY_WORDS } from "@/lib/sky";

const upTo = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, 3]));

describe("boat captain", () => {
  it("every sea word has recorded clips", () => {
    for (const w of SEA_WORDS) {
      expect(VOICE_URLS[w.ask], w.ask).toBeTruthy();
      expect(VOICE_URLS[w.yes], w.yes).toBeTruthy();
    }
    for (let n = 1; n <= 8; n++) expect(VOICE_URLS[`bl_${n}`]).toBeTruthy();
    expect(LINES["bt_start"]).toBeTruthy();
  });

  it("starts easy and grows", () => {
    expect(seaLevel({})).toMatchObject({ choices: 3, load: false, color: false });
    const hi = seaLevel(upTo(20));
    expect(hi.choices).toBe(4);
    expect(hi.loadMax).toBe(8);
    expect(hi.color).toBe(true);
  });

  it("questions always contain the answer exactly once", () => {
    for (let i = 0; i < 300; i++) {
      for (const m of [{}, upTo(5), upTo(20)]) {
        const q = makeSea(m);
        if (q.kind === "find") {
          expect(q.options.filter((o) => o.id === q.word.id)).toHaveLength(1);
          expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        } else if (q.kind === "color") {
          expect(q.options.filter((o) => o.name === q.color.name)).toHaveLength(1);
        } else {
          expect(q.crates).toBeGreaterThan(q.n);
        }
      }
    }
  });
});

describe("sky pilot", () => {
  it("every sky word has recorded clips", () => {
    for (const w of SKY_WORDS) {
      expect(VOICE_URLS[`ap_q_${w.id}`]).toBeTruthy();
      expect(VOICE_URLS[`ap_y_${w.id}`]).toBeTruthy();
    }
    for (const d of ["up", "down", "left", "right"]) expect(VOICE_URLS[`ap_d_${d}`]).toBeTruthy();
    for (const s of ["circle", "square", "triangle", "heart", "star", "diamond"])
      expect(VOICE_URLS[`ap_s_${s}`]).toBeTruthy();
  });

  it("starts with two rings, no numbers or letters, and grows", () => {
    expect(skyLevel({})).toMatchObject({ rings: 2, numberMax: 0, letters: 0 });
    const hi = skyLevel(upTo(20));
    expect(hi.rings).toBe(4);
    expect(hi.numberMax).toBeGreaterThanOrEqual(8);
    expect(hi.letters).toBeGreaterThan(4);
  });

  it("ring questions have the answer once with distinct rings", () => {
    for (let i = 0; i < 400; i++) {
      for (const m of [{}, upTo(5), upTo(20)]) {
        const q = makeSky(m);
        if (q.kind === "ring") {
          expect(q.rings.filter((r) => r.id === q.answer.id)).toHaveLength(1);
          expect(new Set(q.rings.map((r) => r.id)).size).toBe(q.rings.length);
        } else {
          expect(q.options).toContain(q.dir);
        }
      }
    }
  });
});
