import { describe, expect, it } from "vitest";
import { LINES } from "@/lib/voice-lines";
import { VOICE_GROUPS } from "@/lib/voice-groups";
import { VOICE_URLS } from "@/lib/voice-manifest";
import {
  hitBox,
  makeFind,
  makeMemory,
  makeOpposite,
  makeRhyme,
  makeSort,
  makeVocab,
  OPP_PAIRS,
  RHYMES,
  SCENES,
  VWORDS,
} from "@/lib/vocab";

const many = <T>(f: (i: number) => T, n = 200) => Array.from({ length: n }, (_, i) => f(i));
const rich = Object.fromEntries(VWORDS.map((w) => [w.id, 5]));

describe("vocabulary games", () => {
  it("every voice clip they use exists", () => {
    for (const g of [
      "vocab",
      "sorts",
      "opposites",
      "rhymes",
      "memory",
      "findit",
      "places",
      "world",
    ] as const)
      for (const k of VOICE_GROUPS[g]) {
        expect(LINES[k], k).toBeTruthy();
        expect(VOICE_URLS[k], k).toBeTruthy();
      }
  });

  it("picture words always include the answer once and never repeat a picture", () => {
    for (const m of [{}, rich])
      for (const q of many(() => makeVocab(m))) {
        expect(q.options.filter((o) => o.id === q.answer)).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      }
  });

  it("sort safari: exactly one choice is in the asked group", () => {
    for (const m of [{}, { animal: 5, food: 5, vehicle: 5, clothes: 5, body: 5, outside: 5 }])
      for (const q of many(() => makeSort(m))) {
        const cat = q.key;
        const inCat = q.options.filter((o) => VWORDS.find((w) => w.id === o.id)?.cat === cat);
        expect(inCat).toHaveLength(1);
        expect(inCat[0]?.id).toBe(q.answer);
      }
  });

  it("opposites ask for each side and offer both", () => {
    for (const q of many(() =>
      makeOpposite(
        Object.fromEntries(
          OPP_PAIRS.flatMap((p) => [
            [p.a, 5],
            [p.b, 5],
          ]),
        ),
      ),
    )) {
      expect(q.options).toHaveLength(2);
      expect(q.options.map((o) => o.id)).toContain(q.answer);
    }
  });

  it("rhymes: the answer rhymes, the others do not", () => {
    const rich2 = Object.fromEntries(
      RHYMES.flatMap((p) => [
        [p.a, 5],
        [p.b, 5],
      ]),
    );
    for (const q of many(() => makeRhyme(rich2))) {
      const pair = RHYMES.find((p) => p.a === q.key || p.b === q.key);
      const partner = pair?.a === q.key ? pair.b : pair?.a;
      expect(q.answer).toBe(partner);
      for (const o of q.options) if (o.id !== q.answer) expect(o.id).not.toBe(q.key);
      expect(q.ask[0]).toBe(`rh_${q.key}`);
    }
  });

  it("memory deals matching pairs", () => {
    for (const m of [{}, { p3: 5, p4: 5, x: 5 }, rich]) {
      const words = makeMemory(m);
      expect(new Set(words.map((w) => w.id)).size).toBe(words.length);
    }
  });

  it("find-it hotspots sit inside their photos and the hit test works", () => {
    for (const s of SCENES)
      for (const [word, boxes] of Object.entries(s.targets)) {
        expect(VOICE_URLS[`vp_${word}`], word).toBeTruthy();
        expect(VOICE_URLS[`vy_${word}`], word).toBeTruthy();
        for (const [x1, y1, x2, y2] of boxes) {
          expect(x1).toBeGreaterThanOrEqual(0);
          expect(y1).toBeGreaterThanOrEqual(0);
          expect(x2).toBeLessThanOrEqual(s.w);
          expect(y2).toBeLessThanOrEqual(s.h);
          expect(hitBox(s, word, (x1 + x2) / 2 / s.w, (y1 + y2) / 2 / s.h)).toBe(true);
        }
      }
    const q = makeFind({});
    expect(q.scene.targets[q.word]).toBeTruthy();
  });
});

describe("home, town and world words", () => {
  it("every word has voice, the answer is always offered once, and the name cheer plays", async () => {
    const { makePlaces, makeWorld, PLACES, WORLD, nameCheer, NAME_CHEER_KEYS } =
      await import("@/lib/vocab");
    for (const w of [...PLACES, ...WORLD]) {
      expect(VOICE_URLS[`fp_${w.id}`], w.id).toBeTruthy();
      expect(VOICE_URLS[`fy_${w.id}`], w.id).toBeTruthy();
    }
    const rich = Object.fromEntries([...PLACES, ...WORLD].map((w) => [w.id, 5]));
    for (const make of [makePlaces, makeWorld])
      for (const m of [{}, rich])
        for (let i = 0; i < 100; i++) {
          const q = make(m);
          expect(q.options.filter((o) => o.id === q.answer)).toHaveLength(1);
          expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        }
    for (const k of NAME_CHEER_KEYS) {
      expect(VOICE_URLS[k]).toBeTruthy();
      expect(LINES[k]).toMatch(/Sonny/);
    }
    let prev = "";
    for (let i = 0; i < 50; i++) {
      const k = nameCheer();
      expect(k).not.toBe(prev);
      prev = k;
    }
  });
});

describe("bigger tap targets and harder games", () => {
  it("never makes a tap target tiny and starts with the big things", async () => {
    const v = await import("@/lib/vocab");
    for (const sc of v.SCENES) {
      for (const boxes of Object.values(sc.targets)) {
        for (const b of boxes) {
          const [x1, y1, x2, y2] = v.fatBox(sc, b);
          expect(x2 - x1).toBeGreaterThanOrEqual(sc.w * 0.22 - 1);
          expect(y2 - y1).toBeGreaterThanOrEqual(sc.h * 0.13 - 1);
          expect(x1).toBeGreaterThanOrEqual(0);
          expect(x2).toBeLessThanOrEqual(sc.w + 1);
        }
      }
      expect(sc.targets["sirius"] === undefined || sc.id === "parade").toBe(true);
    }
    const easy = v.makeFind({}, undefined, () => 0.5);
    expect(v.findWords(easy.scene, 0)).toContain(easy.word);
  });

  it("grows memory boards and rhyme choices as he improves", async () => {
    const v = await import("@/lib/vocab");
    const rich: Record<string, number> = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`k${i}`, 3]),
    );
    expect(v.memoryPairs({})).toBe(2);
    expect(v.memoryPairs(rich)).toBeGreaterThanOrEqual(8);
    expect(v.makeMemory(rich).length).toBe(v.memoryPairs(rich));
    expect(v.RHYMES.length).toBeGreaterThanOrEqual(20);
    const q = v.makeRhyme(
      Object.fromEntries(
        v.RHYMES.flatMap((p) => [
          [p.a, 3],
          [p.b, 3],
        ]),
      ),
      undefined,
      () => 0.3,
    );
    expect(q.options.length).toBe(4);
  });
});

describe("memory ladder", () => {
  it("only gets harder: bigger boards, then a shorter peek, then no peek", async () => {
    const v = await import("@/lib/vocab");
    const g = await import("@/components/game/MemoryGames");
    const upTo = (n: number) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, 3]));
    let last = v.matchLevel({});
    expect(last.pairs).toBe(2);
    for (let n = 0; n <= 21; n++) {
      const m = upTo(n);
      const cur = v.matchLevel(m);
      expect(cur.pairs).toBeGreaterThanOrEqual(last.pairs);
      expect(cur.level).toBeGreaterThanOrEqual(last.level);
      last = cur;
    }
    expect(last.pairs).toBe(12);
    expect(last.peekMs).toBe(0);
    expect(
      v.matchLevel({ a: 3, b: 3, c: 3, d: 3, e: 3, f: 3, g: 3, h: 3, i: 3, j: 3, k: 3 }, 8).pairs,
    ).toBeLessThanOrEqual(8);
    expect(g.sequenceStart({})).toBe(2);
    expect(g.sequenceStart({ a: 3, b: 3, c: 3, d: 3, e: 3, f: 3, g: 3, h: 3 })).toBe(6);
    expect(g.missingLevel({}).n).toBe(3);
    expect(
      g.missingLevel({ a: 3, b: 3, c: 3, d: 3, e: 3, f: 3, g: 3, h: 3, i: 3 }).lookMs,
    ).toBeLessThan(5000);
  });
});
