import { describe, expect, it } from "vitest";
import { score, type Goal } from "./scoring";
import { FULL_FRAME, type CameraSettings, type Scene } from "./types";
import { APERTURES, SHUTTER_SPEEDS, nearestValue } from "./values";

const f = (printed: number) => nearestValue(APERTURES, printed);
const s = (denominator: number) => nearestValue(SHUTTER_SPEEDS, 1 / denominator);

/** A runner crossing the frame at 6m/s in daylight, EV 13. */
const runner: Scene = {
  id: "runner",
  subjectDistanceM: 8,
  backgroundDistanceM: 40,
  subjectSpeedMps: 6,
  imageWidthPx: 1200,
  sensor: FULL_FRAME,
  regions: [{ id: "runner", ev100: 13, frameShare: 1, inCentre: true, isSubject: true }],
};

const settings = (overrides: Partial<CameraSettings> = {}): CameraSettings => ({
  shutterSeconds: s(125),
  aperture: f(5.6),
  iso: 100,
  focalLengthMm: 100,
  focusDistanceM: 8,
  ...overrides,
});

/** Correct exposure for EV 13 at ISO 100: f/5.6 needs 1/256s (2⁵ / 2¹³). */
const correctlyExposed = settings({ aperture: f(5.6), shutterSeconds: s(250) });

describe("score", () => {
  it("awards three stars when every goal is met", () => {
    const result = score({
      settings: correctlyExposed,
      scene: runner,
      goals: [{ type: "exposure" }],
    });

    expect(result.stars).toBe(3);
    expect(result.headline).toBe("Got it");
  });

  it("never returns more than three or fewer than zero stars", () => {
    for (const aperture of APERTURES) {
      for (const shutterSeconds of SHUTTER_SPEEDS) {
        const result = score({
          settings: settings({ aperture, shutterSeconds }),
          scene: runner,
          goals: [{ type: "exposure" }, { type: "freezeMotion", maxBlurPx: 2 }],
        });

        expect(result.stars).toBeGreaterThanOrEqual(0);
        expect(result.stars).toBeLessThanOrEqual(3);
      }
    }
  });

  it("scores a near-miss on exposure above a wild miss", () => {
    const goals: Goal[] = [{ type: "exposure" }];

    const nearMiss = score({
      settings: settings({ aperture: f(5.6), shutterSeconds: s(500) }),
      scene: runner,
      goals,
    });
    const wildMiss = score({
      settings: settings({ aperture: f(5.6), shutterSeconds: s(4000) }),
      scene: runner,
      goals,
    });

    expect(nearMiss.stars).toBeGreaterThan(wildMiss.stars);
  });

  it("fails a slow shutter against a freeze-motion goal, and says what to do", () => {
    const result = score({
      settings: settings({ shutterSeconds: s(30) }),
      scene: runner,
      goals: [{ type: "freezeMotion", maxBlurPx: 2 }],
    });

    const goal = result.goals[0];
    expect(goal?.passed).toBe(false);
    expect(goal?.critique).toContain("faster shutter");
  });

  it("passes a fast shutter against the same goal", () => {
    const result = score({
      settings: settings({ shutterSeconds: s(2000) }),
      scene: runner,
      goals: [{ type: "freezeMotion", maxBlurPx: 2 }],
    });

    expect(result.goals[0]?.passed).toBe(true);
  });

  it("treats showing motion as the opposite of freezing it", () => {
    const slow = settings({ shutterSeconds: s(15) });

    expect(
      score({ settings: slow, scene: runner, goals: [{ type: "showMotion", minBlurPx: 8 }] })
        .goals[0]?.passed,
    ).toBe(true);
    expect(
      score({ settings: slow, scene: runner, goals: [{ type: "freezeMotion", maxBlurPx: 2 }] })
        .goals[0]?.passed,
    ).toBe(false);
  });

  it("passes a background-blur goal wide open and fails it stopped down", () => {
    const goals: Goal[] = [{ type: "backgroundBlur", minBlurPx: 10 }];

    expect(
      score({ settings: settings({ aperture: f(1.4) }), scene: runner, goals }).goals[0]?.passed,
    ).toBe(true);
    expect(
      score({ settings: settings({ aperture: f(22) }), scene: runner, goals }).goals[0]?.passed,
    ).toBe(false);
  });

  it("names the aperture actually chosen in its critique", () => {
    const result = score({
      settings: settings({ aperture: f(22) }),
      scene: runner,
      goals: [{ type: "backgroundBlur", minBlurPx: 10 }],
    });

    expect(result.goals[0]?.critique).toContain("f/22");
  });

  it("enforces a noise limit", () => {
    const goals: Goal[] = [{ type: "noiseLimit", maxIso: 800 }];

    expect(score({ settings: settings({ iso: 400 }), scene: runner, goals }).goals[0]?.passed).toBe(
      true,
    );
    expect(
      score({ settings: settings({ iso: 3200 }), scene: runner, goals }).goals[0]?.passed,
    ).toBe(false);
  });

  it("flags camera shake on a long lens", () => {
    const result = score({
      settings: settings({ focalLengthMm: 200, shutterSeconds: s(30) }),
      scene: runner,
      goals: [{ type: "handheldSteady" }],
    });

    expect(result.goals[0]?.passed).toBe(false);
    expect(result.goals[0]?.critique).toContain("200mm");
  });

  it("returns a critique for every goal, passed or failed", () => {
    const result = score({
      settings: correctlyExposed,
      scene: runner,
      goals: [
        { type: "exposure" },
        { type: "freezeMotion", maxBlurPx: 2 },
        { type: "noiseLimit", maxIso: 800 },
      ],
    });

    expect(result.goals).toHaveLength(3);
    for (const goal of result.goals) {
      expect(goal.critique.length).toBeGreaterThan(10);
      expect(goal.actual.length).toBeGreaterThan(0);
    }
  });

  it("does not award three stars when any goal fails", () => {
    const result = score({
      settings: settings({ shutterSeconds: s(30) }),
      scene: runner,
      goals: [{ type: "exposure" }, { type: "freezeMotion", maxBlurPx: 2 }],
    });

    expect(result.stars).toBeLessThan(3);
  });

  it("accepts a looser exposure tolerance when a challenge asks for one", () => {
    const oneStopOff = settings({ aperture: f(5.6), shutterSeconds: s(500) });

    expect(
      score({ settings: oneStopOff, scene: runner, goals: [{ type: "exposure" }] }).goals[0]
        ?.passed,
    ).toBe(false);
    expect(
      score({
        settings: oneStopOff,
        scene: runner,
        goals: [{ type: "exposure", toleranceStops: 1 }],
      }).goals[0]?.passed,
    ).toBe(true);
  });
});
