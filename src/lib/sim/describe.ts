import { describeExposure, evaluateExposure } from "./exposure";
import { correctExposureEv100 } from "./meter";
import { subjectBlurPx } from "./motion";
import { backgroundBlurPx } from "./optics";
import type { CameraSettings, Scene } from "./types";

/**
 * A plain-language account of the photograph that was taken.
 *
 * The simulator is a `<canvas>`, which is opaque to assistive technology. Without this, a
 * screen-reader user could operate every control and never learn what their photograph looked
 * like — so this is not a nicety, it is the image itself in the only form some readers get.
 *
 * It lives here rather than in a component because it is derived from the same analytic
 * quantities as the grading, and because it has to be testable.
 */

interface Thresholds {
  /** Above this many pixels, subject movement is visible as a smear. */
  readonly visibleMotionPx: number;
  /** Above this, the background is noticeably soft. */
  readonly visibleBackgroundBlurPx: number;
  /** At or above this ISO, noise is apparent. */
  readonly visibleNoiseIso: number;
}

const DEFAULTS: Thresholds = {
  visibleMotionPx: 2,
  visibleBackgroundBlurPx: 4,
  visibleNoiseIso: 1600,
};

export function describePhotograph(
  settings: CameraSettings,
  scene: Scene,
  thresholds: Thresholds = DEFAULTS,
): string {
  const sentences: string[] = [];

  const exposure = evaluateExposure(settings, correctExposureEv100(scene));
  sentences.push(
    exposure.verdict === "correct"
      ? "Correctly exposed."
      : `${describeExposure(exposure)}${
          exposure.verdict === "over"
            ? " — the brightest areas have lost detail."
            : " — the shadows have gone muddy."
        }`,
  );

  const motion = subjectBlurPx(
    settings,
    scene.subjectSpeedMps,
    scene.subjectDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );

  if (scene.subjectSpeedMps > 0) {
    sentences.push(
      motion <= thresholds.visibleMotionPx
        ? "The subject is frozen sharp."
        : motion < thresholds.visibleMotionPx * 5
          ? "The subject is slightly smeared."
          : "The subject is smeared into a streak.",
    );
  }

  const background = backgroundBlurPx(
    settings,
    scene.backgroundDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );

  sentences.push(
    background <= thresholds.visibleBackgroundBlurPx
      ? "The background is sharp."
      : background < thresholds.visibleBackgroundBlurPx * 4
        ? "The background is softly out of focus."
        : "The background is thrown well out of focus.",
  );

  if (settings.iso >= thresholds.visibleNoiseIso) {
    sentences.push("Noise is visible in the darker areas.");
  }

  return sentences.join(" ");
}
