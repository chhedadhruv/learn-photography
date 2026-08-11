import type { CameraSettings, SensorFormat } from "./types";

/**
 * Depth of field, expressed as the blur circle a background point casts on the sensor.
 *
 * The renderer and the rubric both read `backgroundBlurPx` from here, so what a challenge checks
 * and what the user sees are the same number rather than two approximations of each other.
 */

const M_TO_MM = 1000;

/**
 * Diameter of the blur circle, in millimetres on the sensor, cast by a point at `subjectDistance`
 * when the lens is focused at `focusDistance`.
 *
 * c = (f² · |S₂ − S₁|) / (N · S₂ · (S₁ − f))
 *
 * A point at the focus distance gives zero. The further behind (or in front) it sits, the wider
 * the lens is open, and the longer the focal length, the larger the circle.
 */
export function circleOfConfusionMm(
  focalLengthMm: number,
  aperture: number,
  focusDistanceM: number,
  subjectDistanceM: number,
): number {
  const focus = focusDistanceM * M_TO_MM;
  const subject = subjectDistanceM * M_TO_MM;
  const f = focalLengthMm;

  // Focused at or beyond the lens's own focal length is the only physically meaningful case.
  if (focus <= f || subject <= 0) return 0;

  const numerator = f ** 2 * Math.abs(subject - focus);
  const denominator = aperture * subject * (focus - f);

  return numerator / denominator;
}

/** Converts a blur circle on the sensor into pixels in the rendered image. */
export function mmToPixels(mm: number, sensor: SensorFormat, imageWidthPx: number): number {
  return (mm / sensor.widthMm) * imageWidthPx;
}

/**
 * Blur of the background, in pixels — the number the "blur the background" rubric goal checks and
 * the number the depth-of-field effect is driven by.
 */
export function backgroundBlurPx(
  settings: CameraSettings,
  backgroundDistanceM: number,
  sensor: SensorFormat,
  imageWidthPx: number,
): number {
  const mm = circleOfConfusionMm(
    settings.focalLengthMm,
    settings.aperture,
    settings.focusDistanceM,
    backgroundDistanceM,
  );
  return mmToPixels(mm, sensor, imageWidthPx);
}

/**
 * Whether a point is inside the depth of field — its blur circle is smaller than the format's
 * accepted circle of confusion, so it reads as sharp.
 */
export function isAcceptablySharp(
  settings: CameraSettings,
  subjectDistanceM: number,
  sensor: SensorFormat,
): boolean {
  const mm = circleOfConfusionMm(
    settings.focalLengthMm,
    settings.aperture,
    settings.focusDistanceM,
    subjectDistanceM,
  );
  return mm <= sensor.circleOfConfusionMm;
}

/**
 * Hyperfocal distance in metres: focus here and everything from half this distance to infinity
 * is acceptably sharp. H = f²/(N·c) + f.
 */
export function hyperfocalDistanceM(
  focalLengthMm: number,
  aperture: number,
  sensor: SensorFormat,
): number {
  const mm = focalLengthMm ** 2 / (aperture * sensor.circleOfConfusionMm) + focalLengthMm;
  return mm / M_TO_MM;
}

export interface DepthOfField {
  readonly nearM: number;
  /** `Infinity` when focused at or beyond the hyperfocal distance. */
  readonly farM: number;
}

/** The near and far limits of acceptable sharpness around the focus distance. */
export function depthOfField(settings: CameraSettings, sensor: SensorFormat): DepthOfField {
  const h = hyperfocalDistanceM(settings.focalLengthMm, settings.aperture, sensor) * M_TO_MM;
  const s = settings.focusDistanceM * M_TO_MM;
  const f = settings.focalLengthMm;

  const near = (s * (h - f)) / (h + s - 2 * f);
  const farDenominator = h - s;

  return {
    nearM: near / M_TO_MM,
    farM: farDenominator <= 0 ? Number.POSITIVE_INFINITY : (s * (h - f)) / farDenominator / M_TO_MM,
  };
}
