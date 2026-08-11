import { describe, expect, it } from "vitest";
import { autoExpose, meterError } from "./autoExposure";
import { evaluateExposure } from "./exposure";
import { correctExposureEv100, meterScene } from "./meter";
import { FULL_FRAME, type Scene } from "./types";

const backlit: Scene = {
  id: "backlit",
  subjectDistanceM: 3,
  backgroundDistanceM: 40,
  subjectSpeedMps: 0,
  imageWidthPx: 1000,
  sensor: FULL_FRAME,
  regions: [
    { id: "figure", ev100: 12, frameShare: 0.25, inCentre: true, isSubject: true },
    { id: "sky", ev100: 16, frameShare: 0.75, inCentre: false, isSubject: false },
  ],
};

const snow: Scene = {
  id: "snow",
  subjectDistanceM: 6,
  backgroundDistanceM: 30,
  subjectSpeedMps: 0,
  imageWidthPx: 1000,
  sensor: FULL_FRAME,
  regions: [
    {
      id: "snow",
      ev100: 15,
      frameShare: 1,
      inCentre: true,
      isSubject: true,
      rendersStopsAboveMidGrey: 2,
    },
  ],
};

const even: Scene = {
  ...backlit,
  id: "even",
  regions: [{ id: "wall", ev100: 13, frameShare: 1, inCentre: true, isSubject: true }],
};

const shoot = (scene: Scene, mode: Parameters<typeof meterScene>[1], compensationStops: number) =>
  autoExpose({
    scene,
    meteringMode: mode,
    compensationStops,
    aperture: 5.656854249492381,
    iso: 100,
    focalLengthMm: 85,
    focusDistanceM: 3,
  });

describe("autoExpose", () => {
  it("exposes an even scene correctly with no compensation", () => {
    const result = shoot(even, "average", 0);

    expect(evaluateExposure(result.settings, correctExposureEv100(even)).verdict).toBe("correct");
  });

  it("underexposes a backlit subject, because the meter reads the sky", () => {
    const result = shoot(backlit, "average", 0);

    expect(evaluateExposure(result.settings, correctExposureEv100(backlit)).verdict).toBe("under");
  });

  it("makes the photograph brighter for positive compensation", () => {
    const none = shoot(backlit, "average", 0);
    const plusTwo = shoot(backlit, "average", 2);

    // More light means a longer exposure.
    expect(plusTwo.settings.shutterSeconds).toBeGreaterThan(none.settings.shutterSeconds);
  });

  it("moves the result by exactly the stops asked for", () => {
    const none = shoot(even, "average", 0);
    const plusTwo = shoot(even, "average", 2);

    const before = evaluateExposure(none.settings, correctExposureEv100(even)).deviationStops;
    const after = evaluateExposure(plusTwo.settings, correctExposureEv100(even)).deviationStops;

    expect(after - before).toBeCloseTo(2, 6);
  });
});

/**
 * The teaching gradient this scene was built for: compensation alone cannot rescue an average
 * reading, centre-weighting brings it within reach of the dial, and spot metering removes the
 * error altogether.
 */
describe("metering modes against a backlit subject", () => {
  const correct = correctExposureEv100(backlit);

  it("reads far too bright when averaging the whole frame", () => {
    // Beyond the +3 dial, which is the point of this scene.
    expect(meterError(backlit, "average", correct)).toBeGreaterThan(3.5);
  });

  it("reads closer when weighted towards the centre", () => {
    const centre = meterError(backlit, "centre-weighted", correct);

    expect(centre).toBeLessThan(meterError(backlit, "average", correct));
    expect(centre).toBeLessThan(3);
  });

  it("reads the subject exactly when spot metering", () => {
    expect(meterError(backlit, "spot", correct)).toBeCloseTo(0, 6);
  });

  it("cannot be rescued by compensation alone on average metering", () => {
    // +3 is the end of the dial, and it is still not enough.
    const result = shoot(backlit, "average", 3);

    expect(evaluateExposure(result.settings, correct).verdict).not.toBe("correct");
  });

  it("is rescued by centre-weighting plus compensation", () => {
    // Centre-weighting cuts the error from 3.6 stops to 2.9, which the dial can just cover.
    const result = shoot(backlit, "centre-weighted", 3);

    expect(evaluateExposure(result.settings, correct).verdict).toBe("correct");
  });

  it("is rescued by spot metering with no compensation at all", () => {
    const result = shoot(backlit, "spot", 0);

    expect(evaluateExposure(result.settings, correct).verdict).toBe("correct");
  });
});

/**
 * The opposite failure, and the one nobody predicts: nothing is backlit, every metering mode
 * agrees, and the photograph is still wrong.
 */
describe("metering modes against snow", () => {
  const correct = correctExposureEv100(snow);

  it("expects snow to render brighter than mid-grey", () => {
    expect(correct).toBeCloseTo(13, 6);
  });

  it("underexposes it whatever the metering mode", () => {
    for (const mode of ["average", "centre-weighted", "spot"] as const) {
      expect(evaluateExposure(shoot(snow, mode, 0).settings, correct).verdict, mode).toBe("under");
    }
  });

  it("reads identically in every mode, so switching modes changes nothing", () => {
    expect(meterScene(snow, "average")).toBeCloseTo(meterScene(snow, "spot"), 6);
  });

  it("is rescued only by compensation", () => {
    expect(evaluateExposure(shoot(snow, "average", 2).settings, correct).verdict).toBe("correct");
  });
});
