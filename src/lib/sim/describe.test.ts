import { describe, expect, it } from "vitest";
import { describePhotograph } from "./describe";
import { FULL_FRAME, type CameraSettings, type Scene } from "./types";
import { APERTURES, SHUTTER_SPEEDS, nearestValue } from "./values";

const f = (printed: number) => nearestValue(APERTURES, printed);
const s = (denominator: number) => nearestValue(SHUTTER_SPEEDS, 1 / denominator);

const scene: Scene = {
  id: "test",
  subjectDistanceM: 3,
  backgroundDistanceM: 12,
  subjectSpeedMps: 1.2,
  imageWidthPx: 1000,
  sensor: FULL_FRAME,
  regions: [{ id: "subject", ev100: 14, frameShare: 1, inCentre: true, isSubject: true }],
};

const settings = (overrides: Partial<CameraSettings> = {}): CameraSettings => ({
  shutterSeconds: s(500),
  aperture: f(5.6),
  iso: 100,
  focalLengthMm: 50,
  focusDistanceM: 3,
  ...overrides,
});

/** Correct exposure at EV 14, f/5.6, ISO 100. */
const correct = settings({ aperture: f(5.6), shutterSeconds: s(500) });

describe("describePhotograph", () => {
  it("leads with the exposure", () => {
    expect(describePhotograph(correct, scene)).toMatch(/^Correctly exposed\./);
  });

  it("says which way an exposure went wrong, and what it cost", () => {
    const over = describePhotograph(settings({ shutterSeconds: s(60) }), scene);

    expect(over).toContain("overexposed");
    expect(over).toContain("lost detail");
  });

  it("reports a frozen subject at a fast shutter", () => {
    expect(describePhotograph(correct, scene)).toContain("frozen sharp");
  });

  it("reports a streak at a slow shutter", () => {
    expect(describePhotograph(settings({ shutterSeconds: s(15) }), scene)).toContain("streak");
  });

  it("says nothing about movement when nothing is moving", () => {
    const still: Scene = { ...scene, subjectSpeedMps: 0 };

    expect(describePhotograph(correct, still)).not.toMatch(/frozen|smear|streak/);
  });

  it("distinguishes a sharp background from a blurred one", () => {
    expect(describePhotograph(settings({ aperture: f(22) }), scene)).toContain(
      "background is sharp",
    );
    expect(describePhotograph(settings({ aperture: f(1.4) }), scene)).toContain("out of focus");
  });

  it("mentions noise only at high ISO", () => {
    expect(describePhotograph(settings({ iso: 100 }), scene)).not.toContain("Noise");
    expect(describePhotograph(settings({ iso: 6400 }), scene)).toContain("Noise");
  });

  it("always produces a complete, non-empty description", () => {
    for (const aperture of APERTURES) {
      for (const shutterSeconds of SHUTTER_SPEEDS) {
        const text = describePhotograph(settings({ aperture, shutterSeconds }), scene);

        expect(text.length).toBeGreaterThan(20);
        expect(text.endsWith(".")).toBe(true);
      }
    }
  });
});
