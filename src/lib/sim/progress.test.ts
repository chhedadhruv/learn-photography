import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  XP_PER_STAR,
  earnedBadges,
  highestUnlockedLevel,
  isLevelUnlocked,
  parseProgress,
  recordAttempt,
  serialiseProgress,
  starsFor,
  totalStars,
  totalXp,
  type LevelDefinition,
} from "./progress";

const levels: LevelDefinition[] = [
  { level: 1, name: "Shutter", challengeIds: ["s1", "s2"], starsToUnlockNext: 4 },
  { level: 2, name: "Aperture", challengeIds: ["a1", "a2"], starsToUnlockNext: 4 },
  { level: 3, name: "ISO", challengeIds: ["i1"], starsToUnlockNext: 2 },
];

describe("recordAttempt", () => {
  it("keeps the best result, so a worse retry costs nothing", () => {
    let state = recordAttempt(EMPTY_PROGRESS, "s1", 3);
    state = recordAttempt(state, "s1", 1);

    expect(starsFor(state, "s1")).toBe(3);
  });

  it("improves on a previous best", () => {
    let state = recordAttempt(EMPTY_PROGRESS, "s1", 1);
    state = recordAttempt(state, "s1", 2);

    expect(starsFor(state, "s1")).toBe(2);
  });

  it("returns the same object when nothing improved, so React can skip a render", () => {
    const state = recordAttempt(EMPTY_PROGRESS, "s1", 3);

    expect(recordAttempt(state, "s1", 2)).toBe(state);
  });

  it("does not mutate the state it is given", () => {
    const before = recordAttempt(EMPTY_PROGRESS, "s1", 1);
    recordAttempt(before, "s1", 3);

    expect(starsFor(before, "s1")).toBe(1);
  });
});

describe("totals", () => {
  it("sums stars across challenges", () => {
    let state = recordAttempt(EMPTY_PROGRESS, "s1", 3);
    state = recordAttempt(state, "s2", 2);

    expect(totalStars(state)).toBe(5);
    expect(totalXp(state)).toBe(5 * XP_PER_STAR);
  });

  it("can be scoped to one level's challenges", () => {
    let state = recordAttempt(EMPTY_PROGRESS, "s1", 3);
    state = recordAttempt(state, "a1", 3);

    expect(totalStars(state, ["s1", "s2"])).toBe(3);
  });
});

describe("unlocking", () => {
  it("always leaves level 1 open", () => {
    expect(isLevelUnlocked(EMPTY_PROGRESS, levels, 1)).toBe(true);
  });

  it("keeps level 2 shut until level 1 has enough stars", () => {
    const state = recordAttempt(EMPTY_PROGRESS, "s1", 3);

    expect(isLevelUnlocked(state, levels, 2)).toBe(false);
  });

  it("opens level 2 once the threshold is reached", () => {
    let state = recordAttempt(EMPTY_PROGRESS, "s1", 2);
    state = recordAttempt(state, "s2", 2);

    expect(isLevelUnlocked(state, levels, 2)).toBe(true);
  });

  it("does not let a later level open while an earlier one is still shut", () => {
    // Stars earned in level 2 cannot skip level 1's gate.
    let state = recordAttempt(EMPTY_PROGRESS, "a1", 3);
    state = recordAttempt(state, "a2", 3);

    expect(isLevelUnlocked(state, levels, 3)).toBe(false);
  });

  it("reports the highest level actually reached", () => {
    let state = recordAttempt(EMPTY_PROGRESS, "s1", 2);
    state = recordAttempt(state, "s2", 2);

    expect(highestUnlockedLevel(state, levels)).toBe(2);
  });
});

describe("badges", () => {
  it("awards the first badge on any completed challenge", () => {
    const state = recordAttempt(EMPTY_PROGRESS, "s1", 1);

    expect(earnedBadges(state, levels).map((badge) => badge.id)).toContain("first-frame");
  });

  it("awards a clean sweep only when every challenge in a level is three stars", () => {
    let state = recordAttempt(EMPTY_PROGRESS, "s1", 3);
    expect(earnedBadges(state, levels).map((b) => b.id)).not.toContain("clean-sweep");

    state = recordAttempt(state, "s2", 3);
    expect(earnedBadges(state, levels).map((b) => b.id)).toContain("clean-sweep");
  });

  it("awards nothing on an empty slate", () => {
    expect(earnedBadges(EMPTY_PROGRESS, levels)).toHaveLength(0);
  });
});

describe("persistence", () => {
  it("round-trips", () => {
    const state = recordAttempt(EMPTY_PROGRESS, "s1", 2);

    expect(parseProgress(serialiseProgress(state))).toEqual(state);
  });

  it("starts fresh when there is nothing stored", () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
  });

  // localStorage is user-editable and may hold something written by an older build. Losing
  // progress is annoying; crashing on load is worse.
  it("survives malformed JSON", () => {
    expect(parseProgress("{not json")).toEqual(EMPTY_PROGRESS);
  });

  it("survives a JSON value that is not an object", () => {
    expect(parseProgress("42")).toEqual(EMPTY_PROGRESS);
    expect(parseProgress("null")).toEqual(EMPTY_PROGRESS);
  });

  it("discards an unknown schema version rather than misreading it", () => {
    expect(parseProgress(JSON.stringify({ version: 99, best: { s1: 3 } }))).toEqual(EMPTY_PROGRESS);
  });

  it("drops entries that are not plausible star counts", () => {
    const raw = JSON.stringify({
      version: 1,
      best: { good: 2, tooMany: 99, negative: -1, text: "three", nan: Number.NaN },
    });

    expect(parseProgress(raw).best).toEqual({ good: 2 });
  });
});
