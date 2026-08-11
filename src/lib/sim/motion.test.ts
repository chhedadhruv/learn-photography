import { describe, expect, it } from "vitest";
import {
  handheldSafeShutterSeconds,
  handheldShakePx,
  isHandheldSteady,
  magnification,
  subjectBlurPx,
} from "./motion";
import { FULL_FRAME, type CameraSettings } from "./types";
import { SHUTTER_SPEEDS, nearestValue } from "./values";

const s = (denominator: number) => nearestValue(SHUTTER_SPEEDS, 1 / denominator);

const settings = (overrides: Partial<CameraSettings> = {}): CameraSettings => ({
  shutterSeconds: s(125),
  aperture: 4,
  iso: 100,
  focalLengthMm: 50,
  focusDistanceM: 10,
  ...overrides,
});

describe("magnification", () => {
  it("is small for a distant subject on a short lens", () => {
    expect(magnification(50, 10)).toBeCloseTo(50 / (10000 - 50), 6);
  });

  it("is larger on a longer lens at the same distance", () => {
    expect(magnification(200, 10)).toBeGreaterThan(magnification(50, 10));
  });

  it("returns zero when the subject is closer than the focal length", () => {
    expect(magnification(50, 0.01)).toBe(0);
  });
});

describe("subjectBlurPx", () => {
  it("is zero for a stationary subject", () => {
    expect(subjectBlurPx(settings(), 0, 10, FULL_FRAME, 1200)).toBe(0);
  });

  it("halves when the shutter speed doubles", () => {
    const slow = subjectBlurPx(settings({ shutterSeconds: s(60) }), 5, 10, FULL_FRAME, 1200);
    const fast = subjectBlurPx(settings({ shutterSeconds: s(125) }), 5, 10, FULL_FRAME, 1200);

    // The marked speeds are 2⁻⁶ and 2⁻⁷, so exactly a factor of two.
    expect(fast).toBeCloseTo(slow / 2, 10);
  });

  it("scales linearly with subject speed", () => {
    const walking = subjectBlurPx(settings(), 1.5, 10, FULL_FRAME, 1200);
    const running = subjectBlurPx(settings(), 6, 10, FULL_FRAME, 1200);

    expect(running).toBeCloseTo(walking * 4, 6);
  });

  it("blurs a nearer subject more than a distant one at the same speed", () => {
    const near = subjectBlurPx(settings(), 5, 3, FULL_FRAME, 1200);
    const far = subjectBlurPx(settings(), 5, 30, FULL_FRAME, 1200);

    expect(near).toBeGreaterThan(far);
  });

  it("blurs more on a longer lens", () => {
    const wide = subjectBlurPx(settings({ focalLengthMm: 24 }), 5, 10, FULL_FRAME, 1200);
    const tele = subjectBlurPx(settings({ focalLengthMm: 200 }), 5, 10, FULL_FRAME, 1200);

    expect(tele).toBeGreaterThan(wide);
  });
});

describe("handheld shake", () => {
  it("follows the reciprocal rule", () => {
    expect(handheldSafeShutterSeconds(200)).toBeCloseTo(1 / 200, 10);
    expect(handheldSafeShutterSeconds(24)).toBeCloseTo(1 / 24, 10);
  });

  it("calls 1/250 steady on a 50mm", () => {
    expect(isHandheldSteady(settings({ shutterSeconds: s(250), focalLengthMm: 50 }))).toBe(true);
  });

  it("calls 1/60 shaky on a 200mm", () => {
    expect(isHandheldSteady(settings({ shutterSeconds: s(60), focalLengthMm: 200 }))).toBe(false);
  });

  it("reports no shake when within the rule", () => {
    expect(handheldShakePx(settings({ shutterSeconds: s(250), focalLengthMm: 50 }), 1200)).toBe(0);
  });

  it("grows with each stop beyond the safe speed", () => {
    const oneStop = handheldShakePx(settings({ shutterSeconds: s(30), focalLengthMm: 50 }), 1200);
    const threeStops = handheldShakePx(settings({ shutterSeconds: s(8), focalLengthMm: 50 }), 1200);

    expect(threeStops).toBeGreaterThan(oneStop);
  });
});
