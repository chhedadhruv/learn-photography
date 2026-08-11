import { describe, expect, it } from "vitest";
import { subjectBlurPx } from "@/lib/sim/motion";
import { FULL_FRAME } from "@/lib/sim/types";
import { SHUTTER_SPEEDS, nearestValue } from "@/lib/sim/values";
import {
  PENDULUM,
  PENDULUM_RIG,
  angleAt,
  effectiveSpeedMps,
  horizontalOffsetM,
  instantaneousSpeedMps,
  maxSpeedMps,
  periodSeconds,
  speedFraction,
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
 * The architectural promise: the rubric grades the same motion the renderer draws.
 *
 * The rubric takes a constant speed; the renderer follows the real arc. `effectiveSpeedMps`
 * reconciles them exactly rather than approximately — it is defined as the displacement actually
 * covered divided by the exposure time, so it reproduces the rendered smear by construction, at
 * any point in the swing.
 */
describe("effective speed reproduces the rendered smear exactly", () => {
  const quarterPeriod = periodSeconds(PENDULUM_RIG) / 4;
  const moments = [0, quarterPeriod / 2, quarterPeriod, quarterPeriod * 1.5, quarterPeriod * 2];

  for (const centre of moments) {
    for (const shutterSeconds of SHUTTER_SPEEDS.filter((v) => v <= 1 / 4)) {
      it(`matches at t=${centre.toFixed(2)}s, ${(1 / shutterSeconds).toFixed(0)}th`, () => {
        const speed = effectiveSpeedMps(PENDULUM_RIG, shutterSeconds, centre);
        const rendered = travelDuringExposureM(PENDULUM_RIG, shutterSeconds, centre);

        expect(speed * shutterSeconds).toBeCloseTo(rendered, 12);
      });
    }
  }

  it("never exceeds the pendulum's peak speed", () => {
    for (const centre of moments) {
      expect(effectiveSpeedMps(PENDULUM_RIG, s(60), centre)).toBeLessThanOrEqual(
        maxSpeedMps(PENDULUM_RIG) * 1.000001,
      );
    }
  });

  it("is near zero at the turning point, where the bob is momentarily still", () => {
    const turningPoint = periodSeconds(PENDULUM_RIG) / 4;

    expect(effectiveSpeedMps(PENDULUM_RIG, s(500), turningPoint)).toBeLessThan(
      maxSpeedMps(PENDULUM_RIG) * 0.02,
    );
  });

  it("is at its maximum through the centre of the swing", () => {
    expect(effectiveSpeedMps(PENDULUM_RIG, s(500), 0)).toBeCloseTo(maxSpeedMps(PENDULUM_RIG), 3);
  });
});

describe("instantaneousSpeedMps", () => {
  it("peaks at the bottom of the swing", () => {
    expect(instantaneousSpeedMps(PENDULUM_RIG, 0)).toBeCloseTo(maxSpeedMps(PENDULUM_RIG), 6);
  });

  it("falls to zero at the turning point", () => {
    expect(instantaneousSpeedMps(PENDULUM_RIG, periodSeconds(PENDULUM_RIG) / 4)).toBeCloseTo(0, 6);
  });
});

describe("speedFraction", () => {
  it("is 1 through the centre and near 0 at the turn", () => {
    expect(speedFraction(PENDULUM_RIG, s(500), 0)).toBeCloseTo(1, 2);
    expect(speedFraction(PENDULUM_RIG, s(500), periodSeconds(PENDULUM_RIG) / 4)).toBeLessThan(0.05);
  });

  it("is what tells a well-timed shot from a fast shutter", () => {
    // Below 0.4 the critique explains that timing, not shutter speed, froze the shot.
    const nearTurn = periodSeconds(PENDULUM_RIG) * 0.22;
    expect(speedFraction(PENDULUM_RIG, s(250), nearTurn)).toBeLessThan(0.4);
    expect(speedFraction(PENDULUM_RIG, s(250), 0)).toBeGreaterThan(0.4);
  });
});

describe("scene framing", () => {
  it("moves fast enough to smear visibly at a slow shutter", () => {
    const blur = subjectBlurPx(
      {
        shutterSeconds: s(30),
        aperture: 5.657,
        iso: 100,
        focalLengthMm: PENDULUM.focalLengthMm,
        focusDistanceM: PENDULUM_RIG.bobDistanceM,
      },
      PENDULUM.scene.subjectSpeedMps,
      PENDULUM.scene.subjectDistanceM,
      FULL_FRAME,
      PENDULUM.scene.imageWidthPx,
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
        focalLengthMm: PENDULUM.focalLengthMm,
        focusDistanceM: PENDULUM_RIG.bobDistanceM,
      },
      PENDULUM.scene.subjectSpeedMps,
      PENDULUM.scene.subjectDistanceM,
      FULL_FRAME,
      PENDULUM.scene.imageWidthPx,
    );

    expect(blur).toBeLessThan(1);
  });
});
