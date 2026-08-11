import { describeExposure, evaluateExposure, withinStops } from "./exposure";
import { subjectEv100 } from "./meter";
import { handheldShakePx, subjectBlurPx } from "./motion";
import { backgroundBlurPx } from "./optics";
import { formatAperture, formatIso, formatShutter } from "./values";
import type { CameraSettings, Scene } from "./types";

/**
 * Grading.
 *
 * A challenge declares goals; this evaluates them against quantities derived analytically from
 * the settings. There is no single right answer — f/4 at 1/500 ISO 400 is as valid as f/2.8 at
 * 1/1000 ISO 200 — so a goal states an intent ("freeze the motion") and a threshold, never an
 * expected combination.
 *
 * The critique is the teaching; the stars are decoration. Every failure names the value chosen
 * and the direction to move, because "wrong" teaches nothing.
 */

export type Goal =
  | { readonly type: "exposure"; readonly toleranceStops?: number }
  | { readonly type: "freezeMotion"; readonly maxBlurPx: number }
  | { readonly type: "showMotion"; readonly minBlurPx: number }
  | { readonly type: "backgroundBlur"; readonly minBlurPx: number }
  | { readonly type: "deepFocus"; readonly maxBlurPx: number }
  | { readonly type: "noiseLimit"; readonly maxIso: number }
  | { readonly type: "handheldSteady" };

export interface GoalResult {
  readonly type: Goal["type"];
  readonly passed: boolean;
  /** What the player achieved, in the goal's own terms. */
  readonly actual: string;
  /** One sentence: what happened, and what to change. Shown pass or fail. */
  readonly critique: string;
}

export interface ScoreResult {
  readonly stars: 0 | 1 | 2 | 3;
  readonly goals: readonly GoalResult[];
  readonly headline: string;
}

/** Exposure is scored on a sliding scale rather than pass/fail, since it is a matter of degree. */
const EXPOSURE_TIERS = [
  { withinStops: 0.5, stars: 3 },
  { withinStops: 1, stars: 2 },
  { withinStops: 2, stars: 1 },
] as const;

export interface ScoreInput {
  readonly settings: CameraSettings;
  readonly scene: Scene;
  readonly goals: readonly Goal[];
}

function round(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

function evaluateGoal(goal: Goal, input: ScoreInput): GoalResult {
  const { settings, scene } = input;

  switch (goal.type) {
    case "exposure": {
      const result = evaluateExposure(settings, subjectEv100(scene));
      const tolerance = goal.toleranceStops ?? 0.5;
      const passed = withinStops(result.deviationStops, tolerance);

      return {
        type: goal.type,
        passed,
        actual: describeExposure(result),
        critique: passed
          ? "Exposure is good — the subject is neither washed out nor lost in shadow."
          : result.verdict === "over"
            ? `${describeExposure(result)}. Let in less light: a faster shutter, a smaller aperture, or a lower ISO.`
            : `${describeExposure(result)}. Let in more light: a slower shutter, a wider aperture, or a higher ISO.`,
      };
    }

    case "freezeMotion": {
      const blur = subjectBlurPx(
        settings,
        scene.subjectSpeedMps,
        scene.subjectDistanceM,
        scene.sensor,
        scene.imageWidthPx,
      );
      const passed = blur <= goal.maxBlurPx;

      return {
        type: goal.type,
        passed,
        actual: `${round(blur)}px of subject blur`,
        critique: passed
          ? `Frozen — at ${formatShutter(settings.shutterSeconds)} the subject barely moves during the exposure.`
          : `Still blurred at ${formatShutter(settings.shutterSeconds)}. Use a faster shutter, then open the aperture or raise ISO to keep the exposure.`,
      };
    }

    case "showMotion": {
      const blur = subjectBlurPx(
        settings,
        scene.subjectSpeedMps,
        scene.subjectDistanceM,
        scene.sensor,
        scene.imageWidthPx,
      );
      const passed = blur >= goal.minBlurPx;

      return {
        type: goal.type,
        passed,
        actual: `${round(blur)}px of subject blur`,
        critique: passed
          ? `The movement reads — ${formatShutter(settings.shutterSeconds)} leaves a deliberate trail.`
          : `Too sharp to convey movement at ${formatShutter(settings.shutterSeconds)}. Use a slower shutter, then close the aperture or drop ISO to compensate.`,
      };
    }

    case "backgroundBlur": {
      const blur = backgroundBlurPx(
        settings,
        scene.backgroundDistanceM,
        scene.sensor,
        scene.imageWidthPx,
      );
      const passed = blur >= goal.minBlurPx;

      return {
        type: goal.type,
        passed,
        actual: `${round(blur)}px of background blur`,
        critique: passed
          ? `${formatAperture(settings.aperture)} separates the subject from the background nicely.`
          : `The background is still distinct at ${formatAperture(settings.aperture)}. Open the aperture to a smaller f-number, then use a faster shutter to compensate.`,
      };
    }

    case "deepFocus": {
      const blur = backgroundBlurPx(
        settings,
        scene.backgroundDistanceM,
        scene.sensor,
        scene.imageWidthPx,
      );
      const passed = blur <= goal.maxBlurPx;

      return {
        type: goal.type,
        passed,
        actual: `${round(blur)}px of background blur`,
        critique: passed
          ? `${formatAperture(settings.aperture)} holds the whole scene sharp, front to back.`
          : `The background is soft at ${formatAperture(settings.aperture)}. Close the aperture to a larger f-number, then slow the shutter or raise ISO.`,
      };
    }

    case "noiseLimit": {
      const passed = settings.iso <= goal.maxIso;

      return {
        type: goal.type,
        passed,
        actual: formatIso(settings.iso),
        critique: passed
          ? `${formatIso(settings.iso)} keeps the image clean.`
          : `${formatIso(settings.iso)} will show noise. Stay at or below ${formatIso(goal.maxIso)} and find the light elsewhere — a wider aperture or a slower shutter.`,
      };
    }

    case "handheldSteady": {
      const shake = handheldShakePx(settings, scene.imageWidthPx);
      const passed = shake === 0;

      return {
        type: goal.type,
        passed,
        actual: passed ? "steady" : `${round(shake)}px of shake`,
        critique: passed
          ? `${formatShutter(settings.shutterSeconds)} is fast enough to hand-hold a ${settings.focalLengthMm.toString()}mm lens.`
          : `Camera shake at ${formatShutter(settings.shutterSeconds)}. A ${settings.focalLengthMm.toString()}mm lens wants about ${formatShutter(1 / settings.focalLengthMm)} or faster in the hand.`,
      };
    }
  }
}

/**
 * Stars come from the proportion of goals met, with exposure graded by degree.
 *
 * All goals met is three stars. Otherwise the score is the share of goals passed, so a player who
 * froze the action but botched the exposure still sees they got half of it right.
 */
export function score(input: ScoreInput): ScoreResult {
  const goals = input.goals.map((goal) => evaluateGoal(goal, input));

  const nonExposure = goals.filter((goal) => goal.type !== "exposure");
  const exposureGoal = input.goals.find((goal) => goal.type === "exposure");

  const passedCount = goals.filter((goal) => goal.passed).length;
  const allPassed = passedCount === goals.length;

  let stars: 0 | 1 | 2 | 3;

  if (allPassed) {
    stars = 3;
  } else {
    const otherPassRate =
      nonExposure.length === 0
        ? 1
        : nonExposure.filter((g) => g.passed).length / nonExposure.length;

    // A near-miss on exposure should not score the same as ignoring it entirely.
    const exposureStars = exposureGoal ? exposureTierStars(input) : 3;

    const blended = Math.min(exposureStars, Math.ceil(otherPassRate * 3));
    stars = clampStars(blended);
  }

  return { stars, goals, headline: headlineFor(stars, allPassed) };
}

function exposureTierStars(input: ScoreInput): 0 | 1 | 2 | 3 {
  const result = evaluateExposure(input.settings, subjectEv100(input.scene));
  const deviation = Math.abs(result.deviationStops);

  for (const tier of EXPOSURE_TIERS) {
    if (withinStops(deviation, tier.withinStops)) return tier.stars;
  }
  return 0;
}

function clampStars(value: number): 0 | 1 | 2 | 3 {
  if (value >= 3) return 3;
  if (value === 2) return 2;
  if (value === 1) return 1;
  return 0;
}

function headlineFor(stars: number, allPassed: boolean): string {
  if (allPassed) return "Got it";
  if (stars === 2) return "Nearly there";
  if (stars === 1) return "Part of the way";
  return "Not yet";
}
