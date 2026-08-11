import { settingEv, stopsBetween } from "./exposure";
import { subjectBlurPx } from "./motion";
import { backgroundBlurPx } from "./optics";
import type { CameraSettings, Scene } from "./types";

/**
 * Comparing an attempt against a target photograph.
 *
 * Not by pixels. Two settings can produce nearly identical images — f/2.8 at 1/1000 and f/4 at
 * 1/500 differ only in depth of field — and grading on pixel difference would fail someone who
 * matched the *look* while reaching it another way, which is the thing worth learning.
 *
 * So the comparison is on the qualities a photographer would name: how bright it is, how much
 * the subject is smeared, how far the background has fallen away, and how noisy it is.
 */

export interface MatchTolerances {
  readonly brightnessStops: number;
  /** Relative difference in blur, 0–1. 0.35 means "within about a third". */
  readonly blurRatio: number;
  readonly isoStops: number;
}

export const DEFAULT_TOLERANCES: MatchTolerances = {
  brightnessStops: 0.5,
  blurRatio: 0.35,
  isoStops: 1,
};

export interface MatchAspect {
  readonly id: "brightness" | "motion" | "depth" | "noise";
  readonly label: string;
  readonly matched: boolean;
  readonly note: string;
}

export interface MatchResult {
  readonly aspects: readonly MatchAspect[];
  readonly stars: 0 | 1 | 2 | 3;
  readonly headline: string;
}

/**
 * Compares two blur figures relatively rather than absolutely.
 *
 * A pixel of difference is enormous when the target is sharp and irrelevant when it is a
 * forty-pixel streak, so an absolute threshold would be far too strict at one end and far too
 * lax at the other.
 */
function blurMatches(attempt: number, target: number, ratio: number): boolean {
  const largest = Math.max(attempt, target);
  if (largest < 1.5) return true; // Both effectively sharp.
  return Math.abs(attempt - target) / largest <= ratio;
}

export function compareToTarget(
  attempt: CameraSettings,
  target: CameraSettings,
  scene: Scene,
  tolerances: MatchTolerances = DEFAULT_TOLERANCES,
): MatchResult {
  const brightnessDifference =
    settingEv(target) -
    settingEv(attempt) -
    (stopsBetween(100, target.iso) - stopsBetween(100, attempt.iso));

  const attemptMotion = subjectBlurPx(
    attempt,
    scene.subjectSpeedMps,
    scene.subjectDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );
  const targetMotion = subjectBlurPx(
    target,
    scene.subjectSpeedMps,
    scene.subjectDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );

  const attemptDepth = backgroundBlurPx(
    attempt,
    scene.backgroundDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );
  const targetDepth = backgroundBlurPx(
    target,
    scene.backgroundDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );

  const isoDifference = Math.abs(stopsBetween(target.iso, attempt.iso));

  const aspects: MatchAspect[] = [
    {
      id: "brightness",
      label: "Brightness",
      matched: Math.abs(brightnessDifference) <= tolerances.brightnessStops + 1e-9,
      note:
        Math.abs(brightnessDifference) <= tolerances.brightnessStops + 1e-9
          ? "As bright as the target."
          : brightnessDifference > 0
            ? "Yours is brighter than the target. Let in less light."
            : "Yours is darker than the target. Let in more light.",
    },
    {
      id: "motion",
      label: "Movement",
      matched: blurMatches(attemptMotion, targetMotion, tolerances.blurRatio),
      note: blurMatches(attemptMotion, targetMotion, tolerances.blurRatio)
        ? "The subject is smeared about the same amount."
        : attemptMotion > targetMotion
          ? "Yours is more smeared than the target. Use a faster shutter."
          : "Yours is sharper than the target. Use a slower shutter.",
    },
    {
      id: "depth",
      label: "Background",
      matched: blurMatches(attemptDepth, targetDepth, tolerances.blurRatio),
      note: blurMatches(attemptDepth, targetDepth, tolerances.blurRatio)
        ? "The background falls away about the same amount."
        : attemptDepth > targetDepth
          ? "Your background is softer than the target. Use a narrower aperture."
          : "Your background is sharper than the target. Use a wider aperture.",
    },
    {
      id: "noise",
      label: "Noise",
      matched: isoDifference <= tolerances.isoStops + 1e-9,
      note:
        isoDifference <= tolerances.isoStops + 1e-9
          ? "About as clean as the target."
          : attempt.iso > target.iso
            ? "Yours is noisier than the target. Lower the ISO and find the light elsewhere."
            : "Yours is cleaner than the target — which is no bad thing, but it is not a match.",
    },
  ];

  const matched = aspects.filter((aspect) => aspect.matched).length;
  const stars = matched === 4 ? 3 : matched === 3 ? 2 : matched === 2 ? 1 : 0;

  return {
    aspects,
    stars,
    headline:
      matched === 4
        ? "That's the shot"
        : matched === 3
          ? "Very close"
          : matched >= 1
            ? "Part of the way"
            : "Not yet",
  };
}
