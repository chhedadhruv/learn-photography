import { describe, expect, it } from "vitest";
import { evaluateExposure } from "./exposure";
import {
  autoFillLockedControls,
  canReachCorrectExposure,
  meterScene,
  subjectEv100,
  type ControlName,
} from "./meter";
import { FULL_FRAME, type Scene } from "./types";

/** An evenly lit scene: nothing to fool the meter. */
const even: Scene = {
  id: "even",
  subjectDistanceM: 5,
  backgroundDistanceM: 20,
  subjectSpeedMps: 0,
  imageWidthPx: 1200,
  sensor: FULL_FRAME,
  regions: [
    { id: "subject", ev100: 12, frameShare: 0.3, inCentre: true, isSubject: true },
    { id: "surround", ev100: 12, frameShare: 0.7, inCentre: false, isSubject: false },
  ],
};

/** A backlit subject: a dark face against a bright sky. */
const backlit: Scene = {
  ...even,
  id: "backlit",
  regions: [
    { id: "face", ev100: 10, frameShare: 0.25, inCentre: true, isSubject: true },
    { id: "sky", ev100: 16, frameShare: 0.75, inCentre: false, isSubject: false },
  ],
};

describe("meterScene", () => {
  it("reads an evenly lit scene at its actual brightness", () => {
    expect(meterScene(even, "average")).toBeCloseTo(12, 6);
  });

  it("is fooled by a bright background when averaging", () => {
    // The lesson: the meter reads far brighter than the face, so the camera underexposes it.
    expect(meterScene(backlit, "average")).toBeGreaterThan(subjectEv100(backlit) + 3);
  });

  it("averages luminance rather than EV, which is what makes backlighting so damaging", () => {
    // Averaging the EVs would give (10 + 16)/2 weighted = 14.5. Averaging luminance gives more,
    // because the sky is 64× brighter, not 6 units brighter.
    expect(meterScene(backlit, "average")).toBeGreaterThan(14.5);
  });

  it("is pulled back towards the subject by centre-weighting", () => {
    expect(meterScene(backlit, "centre-weighted")).toBeLessThan(meterScene(backlit, "average"));
  });

  it("reads the subject exactly when spot metering", () => {
    expect(meterScene(backlit, "spot")).toBeCloseTo(10, 6);
  });

  it("falls back to the subject when no region is in the spot", () => {
    const offCentre: Scene = {
      ...backlit,
      regions: backlit.regions.map((region) => ({ ...region, inCentre: false })),
    };

    expect(meterScene(offCentre, "spot")).toBeCloseTo(subjectEv100(offCentre), 6);
  });
});

describe("subjectEv100", () => {
  it("returns the subject region's brightness, not the frame average", () => {
    expect(subjectEv100(backlit)).toBe(10);
  });
});

describe("autoFillLockedControls", () => {
  const levels: { name: string; unlocked: ControlName[] }[] = [
    { name: "level 1 — shutter only", unlocked: ["shutter"] },
    { name: "level 2 — aperture only", unlocked: ["aperture"] },
    { name: "level 3 — ISO only", unlocked: ["iso"] },
    { name: "level 4 — shutter and aperture", unlocked: ["shutter", "aperture"] },
    { name: "level 5 — everything", unlocked: ["shutter", "aperture", "iso"] },
  ];

  for (const level of levels) {
    it(`leaves a solvable exposure for ${level.name}`, () => {
      const settings = autoFillLockedControls({
        scene: even,
        unlocked: level.unlocked,
        focalLengthMm: 50,
        focusDistanceM: 5,
      });

      expect(settings).not.toBeNull();
      if (!settings) return;

      // This is the guarantee that matters: whatever the player is given control of, some
      // combination of it reaches a correct exposure. Otherwise the level is unwinnable and the
      // player blames themselves.
      expect(canReachCorrectExposure(settings, level.unlocked, subjectEv100(even))).toBe(true);
    });
  }

  it("prefers the lowest ISO when ISO is chosen for the player", () => {
    const settings = autoFillLockedControls({
      scene: even,
      unlocked: ["shutter"],
      focalLengthMm: 50,
      focusDistanceM: 5,
    });

    expect(settings?.iso).toBe(100);
  });

  it("works across a wide range of scene brightnesses", () => {
    for (let ev = 6; ev <= 16; ev += 1) {
      const scene: Scene = {
        ...even,
        regions: [{ id: "s", ev100: ev, frameShare: 1, inCentre: true, isSubject: true }],
      };

      const settings = autoFillLockedControls({
        scene,
        unlocked: ["shutter"],
        focalLengthMm: 50,
        focusDistanceM: 5,
      });

      expect(settings, `no solvable setup at EV ${ev.toString()}`).not.toBeNull();
    }
  });
});

describe("canReachCorrectExposure", () => {
  it("is false when nothing is unlocked and the fixed settings are wrong", () => {
    expect(
      canReachCorrectExposure(
        { shutterSeconds: 1 / 128, aperture: 16, iso: 100, focalLengthMm: 50, focusDistanceM: 5 },
        [],
        8,
      ),
    ).toBe(false);
  });

  it("is true when nothing is unlocked but the fixed settings are already right", () => {
    const settings = {
      shutterSeconds: 1 / 128,
      aperture: 16,
      iso: 100,
      focalLengthMm: 50,
      focusDistanceM: 5,
    };

    expect(evaluateExposure(settings, 15).verdict).toBe("correct");
    expect(canReachCorrectExposure(settings, [], 15)).toBe(true);
  });
});
