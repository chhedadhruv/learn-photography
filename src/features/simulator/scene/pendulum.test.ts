import { describe, expect, it } from "vitest";
import { subjectBlurPx } from "@/lib/sim/motion";
import { FULL_FRAME } from "@/lib/sim/types";
import { SHUTTER_SPEEDS, nearestValue } from "@/lib/sim/values";
import {
  PENDULUM_FOCAL_LENGTH_MM,
  PENDULUM_RIG,
  PENDULUM_SCENE,
  angleAt,
  horizontalOffsetM,
  maxSpeedMps,
  periodSeconds,
  travelDuringExposureM,
} from "./pendulum";

const s = (denominator: number) => nearestValue(SHUTTER_SPEEDS, 1 / denominator);

describe("pendulum kinematics", () => {
  it("has a period matching T = 2π√(L/g)", () => {
    expect(periodSeconds(PENDULUM_RIG)).toBeCloseTo(2.198, 2);
  });

  it("is at the bottom of its swing at t = 0, where capture is centred", () => {
    expect(angleAt(PENDULUM_RIG, 0)).toBeCloseTo(0, 10);
    expect(horizontalOffsetM(PENDULUM_RIG, 0)).toBeCloseTo(0, 10);
  });

  it("reaches its amplitude a quarter period later", () => {
    const quarter = periodSeconds(PENDULUM_RIG) / 4;

    expect(angleAt(PENDULUM_RIG, quarter)).toBeCloseTo(PENDULUM_RIG.amplitudeRad, 6);
  });

  it("swings symmetrically either side of vertical", () => {
    expect(horizontalOffsetM(PENDULUM_RIG, 0.2)).toBeCloseTo(
      -horizontalOffsetM(PENDULUM_RIG, -0.2),
      10,
    );
  });
});

/**
 * The architectural promise is that the rubric grades the same motion the renderer draws. The
 * rubric assumes constant speed; the renderer follows the real arc. This measures the gap
 * instead of trusting it, across every shutter speed a shutter-only challenge can offer.
 */
describe("constant-speed model against the true arc", () => {
  const relevantShutters = SHUTTER_SPEEDS.filter((seconds) => seconds <= 1 / 4);

  for (const shutterSeconds of relevantShutters) {
    it(`is within 3% at ${(1 / shutterSeconds).toFixed(0)}th of a second`, () => {
      const trueTravel = travelDuringExposureM(PENDULUM_RIG, shutterSeconds);
      const assumedTravel = maxSpeedMps(PENDULUM_RIG) * shutterSeconds;

      const error = Math.abs(trueTravel - assumedTravel) / assumedTravel;
      expect(error).toBeLessThan(0.03);
    });
  }

  it("is near-exact at the fast end, where freeze-motion challenges are decided", () => {
    const trueTravel = travelDuringExposureM(PENDULUM_RIG, s(500));
    const assumedTravel = maxSpeedMps(PENDULUM_RIG) * s(500);

    expect(Math.abs(trueTravel - assumedTravel) / assumedTravel).toBeLessThan(0.0001);
  });
});

describe("scene framing", () => {
  it("moves fast enough to smear visibly at a slow shutter", () => {
    const blur = subjectBlurPx(
      {
        shutterSeconds: s(30),
        aperture: 5.657,
        iso: 100,
        focalLengthMm: PENDULUM_FOCAL_LENGTH_MM,
        focusDistanceM: PENDULUM_RIG.bobDistanceM,
      },
      PENDULUM_SCENE.subjectSpeedMps,
      PENDULUM_SCENE.subjectDistanceM,
      FULL_FRAME,
      PENDULUM_SCENE.imageWidthPx,
    );

    // Roughly two rule-widths of smear: unmistakable, not a subtle artefact.
    expect(blur).toBeGreaterThan(10);
  });

  it("is sharp at a fast shutter", () => {
    const blur = subjectBlurPx(
      {
        shutterSeconds: s(1000),
        aperture: 5.657,
        iso: 100,
        focalLengthMm: PENDULUM_FOCAL_LENGTH_MM,
        focusDistanceM: PENDULUM_RIG.bobDistanceM,
      },
      PENDULUM_SCENE.subjectSpeedMps,
      PENDULUM_SCENE.subjectDistanceM,
      FULL_FRAME,
      PENDULUM_SCENE.imageWidthPx,
    );

    expect(blur).toBeLessThan(1);
  });
});
