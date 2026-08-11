import { describe, expect, it } from "vitest";
import { compareToTarget } from "./match";
import { FULL_FRAME, type CameraSettings, type Scene } from "./types";
import { APERTURES, SHUTTER_SPEEDS, nearestValue } from "./values";

const f = (printed: number) => nearestValue(APERTURES, printed);
const s = (denominator: number) => nearestValue(SHUTTER_SPEEDS, 1 / denominator);

const scene: Scene = {
  id: "match",
  subjectDistanceM: 4,
  backgroundDistanceM: 20,
  subjectSpeedMps: 4,
  imageWidthPx: 1000,
  sensor: FULL_FRAME,
  regions: [{ id: "subject", ev100: 13, frameShare: 1, inCentre: true, isSubject: true }],
};

const settings = (overrides: Partial<CameraSettings> = {}): CameraSettings => ({
  shutterSeconds: s(250),
  aperture: f(5.6),
  iso: 100,
  focalLengthMm: 85,
  focusDistanceM: 4,
  ...overrides,
});

const target = settings();

const aspect = (result: ReturnType<typeof compareToTarget>, id: string) =>
  result.aspects.find((entry) => entry.id === id);

describe("compareToTarget", () => {
  it("gives full marks for the identical settings", () => {
    const result = compareToTarget(target, target, scene);

    expect(result.stars).toBe(3);
    expect(result.headline).toBe("That's the shot");
  });

  /**
   * The point of comparing qualities rather than pixels: reciprocal settings produce the same
   * brightness and nearly the same picture, and someone who found one instead of the other has
   * understood more, not less.
   */
  it("accepts a reciprocal exposure as equally bright", () => {
    const reciprocal = settings({ aperture: f(4), shutterSeconds: s(500) });

    expect(aspect(compareToTarget(reciprocal, target, scene), "brightness")?.matched).toBe(true);
  });

  it("still notices the depth of field that reciprocal swap changed", () => {
    // f/4 instead of f/5.6 is a stop of extra background blur, which is a visible difference.
    const wider = settings({ aperture: f(2), shutterSeconds: s(2000) });

    expect(aspect(compareToTarget(wider, target, scene), "depth")?.matched).toBe(false);
  });

  it("says which way to move on brightness", () => {
    const bright = settings({ shutterSeconds: s(30) });
    const note = aspect(compareToTarget(bright, target, scene), "brightness")?.note ?? "";

    expect(note).toContain("brighter");
    expect(note).toContain("less light");
  });

  it("says which way to move on movement", () => {
    const smeared = settings({ shutterSeconds: s(15) });
    const note = aspect(compareToTarget(smeared, target, scene), "motion")?.note ?? "";

    expect(note).toContain("faster shutter");
  });

  it("says which way to move on background blur", () => {
    const flat = settings({ aperture: f(22) });
    const note = aspect(compareToTarget(flat, target, scene), "depth")?.note ?? "";

    expect(note).toContain("wider aperture");
  });

  it("treats two effectively sharp results as matching, however small the numbers", () => {
    const fastA = settings({ shutterSeconds: s(2000) });
    const fastB = settings({ shutterSeconds: s(4000) });

    // Absolute thresholds would call a fraction of a pixel a mismatch.
    expect(aspect(compareToTarget(fastA, fastB, scene), "motion")?.matched).toBe(true);
  });

  it("scales its tolerance with the size of the blur", () => {
    const slowA = settings({ shutterSeconds: s(15) });
    const slowB = settings({ shutterSeconds: s(8) });

    // Twice the streak is a real difference even though both are heavily smeared.
    expect(aspect(compareToTarget(slowA, slowB, scene), "motion")?.matched).toBe(false);
  });

  it("notices a noise mismatch", () => {
    const noisy = settings({ iso: 3200, shutterSeconds: s(4000) });

    expect(aspect(compareToTarget(noisy, target, scene), "noise")?.matched).toBe(false);
  });

  it("does not award three stars unless every aspect matches", () => {
    const noisy = settings({ iso: 3200, shutterSeconds: s(4000) });

    expect(compareToTarget(noisy, target, scene).stars).toBeLessThan(3);
  });

  it("never exceeds three stars or drops below zero", () => {
    for (const aperture of APERTURES) {
      for (const shutterSeconds of SHUTTER_SPEEDS) {
        const result = compareToTarget(settings({ aperture, shutterSeconds }), target, scene);

        expect(result.stars).toBeGreaterThanOrEqual(0);
        expect(result.stars).toBeLessThanOrEqual(3);
      }
    }
  });

  it("gives a note for every aspect, matched or not", () => {
    const result = compareToTarget(settings({ shutterSeconds: s(15) }), target, scene);

    expect(result.aspects).toHaveLength(4);
    for (const entry of result.aspects) {
      expect(entry.note.length).toBeGreaterThan(10);
    }
  });
});
