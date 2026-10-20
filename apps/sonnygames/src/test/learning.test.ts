import { describe, expect, it } from "vitest";
import {
  maxCountNumber,
  newlyUnlocked,
  pickWeighted,
  shuffle,
  starsForRound,
  unlockedLetterCount,
  unlockedWordCount,
} from "@/lib/adaptive";
import { GARAGE, LETTER_ORDER, LETTERS, WORDS, letterName } from "@/lib/content";

describe("content", () => {
  it("teaches every letter exactly once, starting with Sonny's name", () => {
    expect([...LETTER_ORDER].sort().join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(LETTER_ORDER.slice(0, 5).join("")).toBe("SONYJ");
    for (const l of LETTERS) {
      expect(l.word).not.toBe("");
      expect(l.emoji).not.toBe("");
      expect(l.sound).not.toBe("");
    }
  });

  it("only uses letters of the alphabet in words and names every letter", () => {
    for (const w of WORDS) expect(w.word).toMatch(/^[A-Z]+$/);
    for (const l of LETTER_ORDER) expect(letterName(l)).not.toBe(l);
  });

  it("has two free cars and increasing star costs", () => {
    expect(GARAGE.filter((c) => c.cost === 0).length).toBeGreaterThanOrEqual(2);
    const costs = GARAGE.map((c) => c.cost);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
  });
});

describe("adaptive difficulty", () => {
  it("starts small and grows as mastery rises", () => {
    expect(unlockedLetterCount({})).toBe(8);
    expect(unlockedLetterCount({ S: 3, O: 3, N: 3 })).toBe(11);
    expect(unlockedLetterCount(Object.fromEntries(LETTER_ORDER.map((l) => [l, 5])))).toBe(26);
    expect(unlockedWordCount({})).toBe(3);
    expect(unlockedWordCount({ CAR: 3, BUS: 3 })).toBe(6);
    expect(maxCountNumber({})).toBe(3);
    expect(maxCountNumber({ "1": 3, "2": 3, "3": 3 })).toBe(6);
  });

  it("never unlocks more than exists", () => {
    const all = Object.fromEntries(WORDS.map((w) => [w.word, 5]));
    expect(unlockedWordCount(all)).toBe(WORDS.length);
    expect(
      maxCountNumber(Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i), 5]))),
    ).toBe(10);
  });

  it("favours items that are less mastered", () => {
    const items = ["new", "known"];
    const mastery = (i: string) => (i === "known" ? 5 : 0);
    let newCount = 0;
    for (let i = 0; i < 2000; i++) if (pickWeighted(items, mastery) === "new") newCount++;
    expect(newCount).toBeGreaterThan(1500); // weight 6 vs 1 => about 86%
  });

  it("avoids repeating an excluded item when there is a choice", () => {
    for (let i = 0; i < 50; i++) {
      expect(
        pickWeighted(
          ["a", "b", "c"],
          () => 0,
          Math.random,
          (x) => x === "a",
        ),
      ).not.toBe("a");
    }
    // ...but still returns something when everything is excluded
    expect(
      pickWeighted(
        ["a"],
        () => 0,
        Math.random,
        () => true,
      ),
    ).toBe("a");
  });

  it("shuffles without losing items", () => {
    expect(shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("awards stars and reports newly unlocked cars", () => {
    expect(starsForRound(5, 5)).toBe(2);
    expect(starsForRound(4, 5)).toBe(2);
    expect(starsForRound(2, 5)).toBe(1);
    expect(newlyUnlocked(1, 2).map((c) => c.id)).toEqual(["sunny-speedster"]);
    expect(newlyUnlocked(2, 2)).toEqual([]);
  });
});

describe("people", () => {
  it("starts with four people and grows", async () => {
    const { unlockedPeopleCount } = await import("@/lib/adaptive");
    const { PEOPLE } = await import("@/lib/content");
    expect(unlockedPeopleCount({})).toBe(4);
    expect(unlockedPeopleCount({ ryanne: 3, quamie: 3 })).toBe(7);
    expect(unlockedPeopleCount(Object.fromEntries(PEOPLE.map((p) => [p.id, 5])))).toBe(
      PEOPLE.length,
    );
  });
});
