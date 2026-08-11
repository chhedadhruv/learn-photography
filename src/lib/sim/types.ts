/**
 * Shared shapes for the simulation core.
 *
 * Nothing in `src/lib/sim` may import three.js. Every quantity here is a plain number in a
 * documented unit, computed analytically, so grading is deterministic, identical on every GPU,
 * and testable without a renderer.
 */

/** Distances are metres, focal lengths millimetres, times seconds, speeds metres per second. */
export interface CameraSettings {
  /** Exposure time in seconds. 1/250s is 0.004. */
  readonly shutterSeconds: number;
  /** f-number. Smaller means a wider opening and more light. */
  readonly aperture: number;
  /** Sensor sensitivity, ISO arithmetic scale. */
  readonly iso: number;
  readonly focalLengthMm: number;
  /** Distance the lens is focused at, in metres. */
  readonly focusDistanceM: number;
}

export interface SensorFormat {
  readonly name: string;
  readonly widthMm: number;
  readonly heightMm: number;
  /**
   * The largest blur circle still accepted as "sharp" for this format, in millimetres. The
   * conventional full-frame figure, from a 0.2mm tolerance at 25cm viewing distance on an 8×10.
   */
  readonly circleOfConfusionMm: number;
}

/**
 * Full-frame 35mm: the format photography texts are written against, so "50mm is normal" holds
 * and no crop-factor arithmetic intrudes on a beginner lesson.
 */
export const FULL_FRAME: SensorFormat = {
  name: "Full-frame 35mm",
  widthMm: 36,
  heightMm: 24,
  circleOfConfusionMm: 0.029,
};

/** A patch of the frame with its own brightness, used by the metering models. */
export interface SceneRegion {
  readonly id: string;
  /** Brightness as EV at ISO 100. Higher is brighter. */
  readonly ev100: number;
  /** Share of the frame this region covers, 0–1. Regions in a scene should sum to 1. */
  readonly frameShare: number;
  /** Whether the region falls under the centre spot, for spot and centre-weighted metering. */
  readonly inCentre: boolean;
  /**
   * The thing the photograph is of. Exposure is graded against this region, not the meter's
   * reading — a backlit portrait metered off the whole frame is "correct" to the camera and
   * wrong to everyone else, which is precisely the lesson.
   */
  readonly isSubject: boolean;
}

export interface Scene {
  readonly id: string;
  /** Distance from camera to the subject being photographed, metres. */
  readonly subjectDistanceM: number;
  /** Distance to whatever sits behind the subject, metres. Drives background blur. */
  readonly backgroundDistanceM: number;
  /**
   * Subject speed across the frame, metres per second. Motion along the lens axis barely blurs,
   * so only the perpendicular component is modelled.
   */
  readonly subjectSpeedMps: number;
  readonly regions: readonly SceneRegion[];
  /** Width of the rendered image in pixels — blur is judged in pixels, as the viewer sees it. */
  readonly imageWidthPx: number;
  readonly sensor: SensorFormat;
}
