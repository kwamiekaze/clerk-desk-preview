import { describe, expect, it } from "vitest";
import { LINES } from "@/lib/voice-lines";
import { VOICE_URLS } from "@/lib/voice-manifest";
import {
  crateLetters,
  dropCars,
  makeTrainWords,
  TRAIN_LETTERS,
  TRAIN_WORDS,
  trainLevel,
} from "@/lib/wordtrain";

const upTo = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, 3]));

describe("word train", () => {
  it("has a recorded line for every word and letter it can say", () => {
    for (const w of TRAIN_WORDS) {
      expect(LINES[w.intro], w.intro).toBeTruthy();
      expect(LINES[w.done], w.done).toBeTruthy();
      expect(VOICE_URLS[w.intro], w.intro).toBeTruthy();
      expect(VOICE_URLS[w.done], w.done).toBeTruthy();
    }
    for (const l of TRAIN_LETTERS) {
      expect(VOICE_URLS[`tp_${l}`]).toBeTruthy();
      expect(VOICE_URLS[`td_${l}`]).toBeTruthy();
    }
  });

  it("keeps words 2-5 letters and gets harder", () => {
    for (const w of TRAIN_WORDS) expect(w.word.length).toBeLessThanOrEqual(5);
    expect(trainLevel({})).toMatchObject({ level: 1, len: 3, crates: 2, mixed: false, say: true });
    const top = trainLevel(upTo(20));
    expect(top.len).toBe(5);
    expect(top.say).toBe(false);
    expect(trainLevel(upTo(5)).level).toBeGreaterThan(1);
  });

  it("starts with short words only and never repeats a word in a trip", () => {
    for (let i = 0; i < 100; i++) {
      const ws = makeTrainWords({}, 3);
      expect(new Set(ws.map((w) => w.id)).size).toBe(3);
      for (const w of ws) expect(w.word.length).toBe(3);
    }
  });

  it("crates always include the needed letter once, with distinct decoys", () => {
    for (let i = 0; i < 100; i++) {
      const c = crateLetters("BALL", 2, 4);
      expect(c).toHaveLength(4);
      expect(c.filter((x) => x === "L")).toHaveLength(1);
      expect(new Set(c).size).toBe(4);
    }
  });

  it("drop-off cars hold every letter of the word", () => {
    const cars = dropCars("BALL", true);
    expect(cars.map((c) => c.letter).sort()).toEqual(["A", "B", "L", "L"]);
    expect(
      dropCars("CAR", false)
        .map((c) => c.letter)
        .join(""),
    ).toBe("CAR");
  });
});
