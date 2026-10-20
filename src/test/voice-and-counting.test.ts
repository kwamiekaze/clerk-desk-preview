import { describe, expect, it } from "vitest";
import { GARAGE, LETTER_ORDER, WORDS } from "@/lib/content";
import {
  compareAnswer,
  makeCompare,
  makeParking,
  makeTraffic,
  numberOptions,
} from "@/lib/counting";
import { CHEER_KEYS, LINES, NAME } from "@/lib/voice-lines";
import { VOICE_URLS } from "@/lib/voice-manifest";
import { COUNTING_THEMES } from "@/lib/counting-themes";

describe("voice clips", () => {
  it("has a recorded clip for every line the game can say", () => {
    const missing = Object.keys(LINES).filter((k) => !VOICE_URLS[k]);
    expect(missing).toEqual([]);
  });

  it("always uses the full name, never just Sonny", () => {
    for (const text of Object.values(LINES)) {
      if (
        /sonny/i.test(text) &&
        !/^Let's spell Sonny!$|^Sonny, you know it!$|^S, O, N, N, Y\./.test(text)
      ) {
        expect(text).toContain(NAME);
      }
    }
    expect(CHEER_KEYS.length).toBe(8);
  });

  it("covers every letter, word, number and car", () => {
    for (const l of LETTER_ORDER) {
      for (const p of ["letter_", "sound_", "find_", "findlow_"]) expect(LINES[p + l]).toBeTruthy();
    }
    for (const w of WORDS) {
      expect(LINES[`spell_${w.word}`]).toBeTruthy();
      expect(LINES[`word_${w.word}`]).toBeTruthy();
    }
    for (let n = 1; n <= 10; n++) {
      expect(LINES[`n_${n}`]).toBeTruthy();
      expect(LINES[`park_${n}`]).toBeTruthy();
    }
    for (const c of GARAGE) expect(LINES[`car_${c.id}`]).toBeTruthy();
  });
});

describe("counting games", () => {
  it("ships six distinct Sonny counting adventures with five object sets each", () => {
    expect(Object.keys(COUNTING_THEMES)).toEqual([
      "police",
      "sailor",
      "musician",
      "foodie",
      "sleeping",
      "dinosaur",
    ]);
    for (const theme of Object.values(COUNTING_THEMES)) {
      expect(theme.itemSets).toHaveLength(5);
      expect(new Set(theme.itemSets.map((set) => set.name)).size).toBe(5);
      expect(theme.sonny).toMatch(/^\/sonny\/.+\.webp$/);
    }
  });

  it("parking lot always has more bays than the target", () => {
    for (let i = 0; i < 200; i++) {
      const q = makeParking(10, {});
      expect(q.n).toBeGreaterThanOrEqual(1);
      expect(q.n).toBeLessThanOrEqual(10);
      expect(q.bays).toBeGreaterThan(q.n);
      expect(q.bays).toBeLessThanOrEqual(12);
    }
  });

  it("more cars never ties and always has one right side", () => {
    for (let i = 0; i < 300; i++) {
      const q = makeCompare(4, true);
      expect(q.left).not.toBe(q.right);
      expect(Math.max(q.left, q.right)).toBeLessThanOrEqual(4);
      expect(q.leftColor.name).not.toBe(q.rightColor.name);
      const side = compareAnswer(q);
      const winner = side === "left" ? q.left : q.right;
      const loser = side === "left" ? q.right : q.left;
      expect(q.ask === "more" ? winner > loser : winner < loser).toBe(true);
    }
    expect(makeCompare(4, false).ask).toBe("more");
  });

  it("traffic jam has exactly n cars of the asked colour, plus other colours", () => {
    for (let i = 0; i < 300; i++) {
      const q = makeTraffic(10, {});
      const target = q.cars.filter((c) => c.color.name === q.target.name).length;
      expect(target).toBe(q.n);
      expect(q.cars.length).toBeGreaterThan(q.n);
      expect(q.cars.length).toBeLessThanOrEqual(12);
    }
  });

  it("number choices include the answer exactly once", () => {
    for (let a = 1; a <= 10; a++) {
      const opts = numberOptions(a, 10);
      expect(opts.filter((o) => o === a)).toHaveLength(1);
      expect(new Set(opts).size).toBe(opts.length);
    }
  });
});

import { ghostKey, ghostOptions, ghostTier, makeGhost, type GhostQuestion } from "@/lib/ghosts";

describe("ghost game questions", () => {
  const rngFrom = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  it("grows with mastery", () => {
    expect(ghostTier({})).toBe(0);
    expect(ghostTier({ a: 3, b: 3 })).toBe(1);
    expect(ghostTier({ a: 3, b: 3, c: 3, d: 3, e: 3 })).toBe(2);
    const big = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, 3]));
    expect(ghostTier(big)).toBe(4);
  });

  it("keeps every question in range and the answer right", () => {
    for (let seed = 1; seed < 400; seed++) {
      const rng = rngFrom(seed);
      for (const tier of [0, 1, 2, 3, 4] as const) {
        const q: GhostQuestion = makeGhost(tier, {}, undefined, rng);
        if (q.kind === "count") {
          expect(q.n).toBeGreaterThanOrEqual(1);
          expect(q.n).toBeLessThanOrEqual(tier === 0 ? 5 : 10);
        } else if (q.kind === "add") {
          expect(q.a).toBeGreaterThanOrEqual(1);
          expect(q.b).toBeGreaterThanOrEqual(1);
          expect(q.a + q.b).toBe(q.n);
          expect(q.n).toBeLessThanOrEqual(10);
        } else if (q.kind === "sub") {
          expect(q.gone).toBeGreaterThanOrEqual(1);
          expect(q.total - q.gone).toBe(q.n);
          expect(q.n).toBeGreaterThanOrEqual(1);
        } else {
          expect(q.left).not.toBe(q.right);
          expect(q.answer).toBe(q.left > q.right ? "left" : "right");
        }
        if (q.kind !== "more") {
          const opts = ghostOptions(q.n, rng);
          expect(opts).toContain(q.n);
          expect(new Set(opts).size).toBe(opts.length);
          expect(Math.min(...opts)).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it("does not repeat the same question back to back when it can avoid it", () => {
    const q = makeGhost(1, {}, "count5", rngFrom(7));
    expect(ghostKey(q)).not.toBe("count5");
  });
});

describe("number train and pattern parade questions", () => {
  it("always includes the answer among valid, distinct options", async () => {
    const { makeNumber, numOptions } = await import("@/lib/numbers");
    const { makePattern } = await import("@/lib/patterns");
    for (const tier of [0, 1, 2, 3] as const) {
      for (let i = 0; i < 200; i++) {
        const q = makeNumber(tier, {});
        const max = tier === 3 ? 20 : tier === 0 ? 5 : 10;
        expect(q.answer).toBeGreaterThanOrEqual(1);
        expect(q.answer).toBeLessThanOrEqual(max + 1);
        if (q.kind !== "big" && q.kind !== "small") {
          const o = numOptions(q.answer, max);
          expect(o).toContain(q.answer);
          expect(new Set(o).size).toBe(o.length);
        }
        const p = makePattern(tier);
        expect(p.options).toContain(p.answer);
        expect(new Set(p.options).size).toBe(p.options.length);
      }
    }
  });
});
