import { mmToPixels } from "./optics";
import type { CameraSettings, SensorFormat } from "./types";

/**
 * Motion blur: how far the subject's image travels across the sensor while the shutter is open.
 *
 * The renderer produces the smear by rendering sub-steps across the same interval, so the number
 * checked here and the smear a user sees come from one model rather than two.
 */

const M_TO_MM = 1000;

/**
 * Magnification — how many millimetres on the sensor one millimetre at the subject occupies.
 * m = f / (S − f).
 */
export function magnification(focalLengthMm: number, subjectDistanceM: number): number {
  const subject = subjectDistanceM * M_TO_MM;
  if (subject <= focalLengthMm) return 0;
  return focalLengthMm / (subject - focalLengthMm);
}

/**
 * Subject blur in pixels: distance travelled during the exposure, projected onto the sensor.
 *
 * Only motion across the frame is modelled. A subject moving towards the lens barely smears, and
 * pretending otherwise would teach the wrong intuition about when a fast shutter is needed.
 */
export function subjectBlurPx(
  settings: CameraSettings,
  subjectSpeedMps: number,
  subjectDistanceM: number,
  sensor: SensorFormat,
  imageWidthPx: number,
): number {
  if (subjectSpeedMps <= 0) return 0;

  const travelledMm = subjectSpeedMps * settings.shutterSeconds * M_TO_MM;
  const onSensorMm = travelledMm * magnification(settings.focalLengthMm, subjectDistanceM);

  return mmToPixels(onSensorMm, sensor, imageWidthPx);
}

/**
 * The reciprocal rule: handholding is safe at roughly 1/focal-length. A 200mm lens needs about
 * 1/200s; a 24mm lens tolerates 1/25s. It is a rule of thumb, not physics, but it is the one
 * beginners are taught and the one that keeps their pictures sharp.
 */
export function handheldSafeShutterSeconds(focalLengthMm: number): number {
  return 1 / focalLengthMm;
}

export function isHandheldSteady(settings: CameraSettings): boolean {
  return settings.shutterSeconds <= handheldSafeShutterSeconds(settings.focalLengthMm);
}

/**
 * Camera shake in pixels, estimated from how far past the reciprocal rule the shutter is.
 *
 * Unlike subject blur this is not deterministic in reality — it depends on the person holding
 * the camera. Modelled as growing with the number of stops beyond the safe speed, so the lesson
 * ("a longer lens needs a faster shutter") holds without pretending to a precision it lacks.
 */
export function handheldShakePx(settings: CameraSettings, imageWidthPx: number): number {
  const safe = handheldSafeShutterSeconds(settings.focalLengthMm);
  if (settings.shutterSeconds <= safe) return 0;

  const stopsBeyond = Math.log2(settings.shutterSeconds / safe);

  // Roughly one pixel of shake per 1000px of image width, per stop beyond the safe speed.
  return stopsBeyond * (imageWidthPx / 1000);
}
