import type { CameraSettings } from "./types";

/**
 * Exposure arithmetic.
 *
 * Two numbers matter. The *setting EV* is what the camera is dialled to, from aperture and
 * shutter alone. The *required EV* is what the scene and the chosen ISO demand. The gap between
 * them, in stops, is the whole of exposure — and it is what the rubric grades.
 */

/**
 * EV as set on the camera: `log2(N² / t)`.
 *
 * Note ISO is absent. EV describes the light the aperture and shutter admit; sensitivity is a
 * separate lever, which is exactly why it is a third control rather than part of the first two.
 */
export function settingEv(settings: Pick<CameraSettings, "aperture" | "shutterSeconds">): number {
  return Math.log2(settings.aperture ** 2 / settings.shutterSeconds);
}

/**
 * The EV the camera must be set to for this scene at this ISO.
 *
 * Doubling ISO buys one stop, so the camera can be set one EV higher — a faster shutter or a
 * smaller aperture — for the same brightness.
 */
export function requiredEv(sceneEv100: number, iso: number): number {
  return sceneEv100 + Math.log2(iso / 100);
}

export type ExposureVerdict = "under" | "correct" | "over";

export interface ExposureResult {
  /**
   * Stops away from correct. Positive means overexposed (too much light), negative means
   * underexposed. Sign follows the exposure meter needle a photographer already reads: right of
   * centre is bright.
   */
  readonly deviationStops: number;
  readonly verdict: ExposureVerdict;
  readonly settingEv: number;
  readonly requiredEv: number;
}

/** Anything inside this is close enough that the difference is not visible on screen. */
export const CORRECT_WITHIN_STOPS = 0.5;

/**
 * Thresholds land on exact stop boundaries constantly here — a whole-stop ladder means a
 * deviation of "exactly 1" is the normal case, not an edge case. Computed through logarithms it
 * arrives as 1.0000000000000002, so a bare `<=` would fail a comparison the player got right.
 */
const STOP_EPSILON = 1e-9;

export function withinStops(deviationStops: number, toleranceStops: number): boolean {
  return Math.abs(deviationStops) <= toleranceStops + STOP_EPSILON;
}

export function evaluateExposure(settings: CameraSettings, sceneEv100: number): ExposureResult {
  const setting = settingEv(settings);
  const required = requiredEv(sceneEv100, settings.iso);

  // A setting EV below what is required means a wider aperture or slower shutter than needed,
  // so more light reaches the sensor: overexposed.
  const deviationStops = required - setting;

  return {
    deviationStops,
    verdict: withinStops(deviationStops, CORRECT_WITHIN_STOPS)
      ? "correct"
      : deviationStops > 0
        ? "over"
        : "under",
    settingEv: setting,
    requiredEv: required,
  };
}

/**
 * True when two settings admit the same total light — the reciprocity that makes f/2.8 at
 * 1/1000 and f/4 at 1/500 the same photograph as far as brightness goes.
 */
export function isEquivalentExposure(a: CameraSettings, b: CameraSettings): boolean {
  const evA = settingEv(a) - Math.log2(a.iso / 100);
  const evB = settingEv(b) - Math.log2(b.iso / 100);
  return Math.abs(evA - evB) < 1e-9;
}

/** How many stops apart two values on the same geometric ladder are. */
export function stopsBetween(from: number, to: number): number {
  return Math.log2(to / from);
}

/** Plain-language direction for the critique, e.g. "1.5 stops overexposed". */
export function describeExposure(result: ExposureResult): string {
  if (result.verdict === "correct") return "Correctly exposed";

  const stops = Math.abs(result.deviationStops);
  const rounded = Math.round(stops * 10) / 10;
  const unit = rounded === 1 ? "stop" : "stops";

  return `${rounded.toString()} ${unit} ${result.verdict === "over" ? "overexposed" : "underexposed"}`;
}
