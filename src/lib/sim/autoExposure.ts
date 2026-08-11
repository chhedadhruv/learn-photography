import { requiredEv } from "./exposure";
import { meterScene, type MeteringMode } from "./meter";
import type { CameraSettings, Scene } from "./types";
import { SHUTTER_SPEEDS, nearestValue } from "./values";

/**
 * What the camera does when it is left to decide.
 *
 * Every other module here is manual, where the meter is only advice — you would set a correct
 * exposure by eye and never see the meter being fooled. Automatic exposure is the only framing
 * in which a metering error becomes a mistake you can watch happen, which is the whole subject
 * of the metering lessons.
 *
 * Aperture-priority: aperture and sensitivity are held, and the shutter is solved for. It is the
 * mode most people leave a camera in, and it keeps one number moving so the cause is legible.
 */

/** Full stops, matching every other control on the site. */
export const COMPENSATION_STOPS = [-3, -2, -1, 0, 1, 2, 3] as const;
export type CompensationStops = (typeof COMPENSATION_STOPS)[number];

export interface AutoExposureRequest {
  readonly scene: Scene;
  readonly meteringMode: MeteringMode;
  /** Positive makes the photograph brighter, as the dial on a camera does. */
  readonly compensationStops: number;
  readonly aperture: number;
  readonly iso: number;
  readonly focalLengthMm: number;
  readonly focusDistanceM: number;
}

export interface AutoExposureResult {
  readonly settings: CameraSettings;
  /** What the meter reported, as EV at ISO 100. */
  readonly meteredEv100: number;
  /** The EV the camera aimed for, after compensation. */
  readonly targetEv: number;
}

export function autoExpose(request: AutoExposureRequest): AutoExposureResult {
  const meteredEv100 = meterScene(request.scene, request.meteringMode);

  // Compensation asks for *more* light, which means setting the camera to a lower EV.
  const targetEv = requiredEv(meteredEv100, request.iso) - request.compensationStops;

  const idealShutter = request.aperture ** 2 / 2 ** targetEv;

  return {
    settings: {
      shutterSeconds: nearestValue(SHUTTER_SPEEDS, idealShutter),
      aperture: request.aperture,
      iso: request.iso,
      focalLengthMm: request.focalLengthMm,
      focusDistanceM: request.focusDistanceM,
    },
    meteredEv100,
    targetEv,
  };
}

/**
 * How far the meter's reading is from what the subject actually needs, in stops.
 *
 * Positive means the meter is reading brighter than the subject — which is the backlit case, and
 * why the camera will underexpose the face. This is the number a photographer is really
 * correcting when they turn the compensation dial.
 */
export function meterError(scene: Scene, meteringMode: MeteringMode, correctEv100: number): number {
  return meterScene(scene, meteringMode) - correctEv100;
}
