import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, isLevelUnlocked, recordAttempt } from "@/lib/sim/progress";
import { CHALLENGES } from "./registry";
import { LEVEL_DEFINITIONS, levelDefinition, starsStillNeeded } from "./levels";

describe("level definitions", () => {
  it("covers every level in the ladder", () => {
    expect(LEVEL_DEFINITIONS.map((level) => level.level)).toEqual([1, 2, 3, 4, 5]);
  });

  it("lists exactly the challenges belonging to each level", () => {
    for (const definition of LEVEL_DEFINITIONS) {
      const expected = CHALLENGES.filter((c) => c.level === definition.level).map((c) => c.id);
      expect(definition.challengeIds).toEqual(expected);
    }
  });

  it("asks for fewer stars than a level can award", () => {
    // Requiring perfection would let one stubborn challenge block the whole ladder.
    for (const definition of LEVEL_DEFINITIONS) {
      expect(definition.starsToUnlockNext).toBeLessThan(definition.challengeIds.length * 3);
    }
  });
});

describe("unlocking through the ladder", () => {
  const level1 = levelDefinition(1);

  it("opens level 1 to everyone", () => {
    expect(isLevelUnlocked(EMPTY_PROGRESS, LEVEL_DEFINITIONS, 1)).toBe(true);
  });

  it("keeps level 2 shut on an empty slate", () => {
    expect(isLevelUnlocked(EMPTY_PROGRESS, LEVEL_DEFINITIONS, 2)).toBe(false);
  });

  it("opens level 2 at the threshold, not before", () => {
    expect(level1).toBeDefined();
    if (!level1) return;

    // Five stars across level 1 is not enough; six is.
    let five = EMPTY_PROGRESS;
    five = recordAttempt(five, level1.challengeIds[0] ?? "", 3);
    five = recordAttempt(five, level1.challengeIds[1] ?? "", 2);
    expect(isLevelUnlocked(five, LEVEL_DEFINITIONS, 2)).toBe(false);

    const six = recordAttempt(five, level1.challengeIds[2] ?? "", 1);
    expect(isLevelUnlocked(six, LEVEL_DEFINITIONS, 2)).toBe(true);
  });

  it("does not let stars in a later level unlock an earlier gate", () => {
    const level3 = levelDefinition(3);
    if (!level3) return;

    let state = EMPTY_PROGRESS;
    for (const id of level3.challengeIds) state = recordAttempt(state, id, 3);

    expect(isLevelUnlocked(state, LEVEL_DEFINITIONS, 4)).toBe(false);
  });
});

describe("starsStillNeeded", () => {
  it("counts down towards the threshold", () => {
    expect(starsStillNeeded(1, 0)).toBe(6);
    expect(starsStillNeeded(1, 4)).toBe(2);
  });

  it("never goes negative once the threshold is passed", () => {
    expect(starsStillNeeded(1, 9)).toBe(0);
  });

  it("returns zero for a level that does not exist", () => {
    expect(starsStillNeeded(0, 0)).toBe(0);
  });
});
