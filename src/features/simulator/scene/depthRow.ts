import { FULL_FRAME, type Scene } from "@/lib/sim/types";
import type { SceneSpec } from "./types";

/**
 * A row of markers receding from the camera at known distances.
 *
 * Depth of field is otherwise a vague impression — "the background is blurry". With markers at
 * stated distances it becomes measurable: at f/2 the third marker is soft, at f/11 the fifth is
 * still readable. The same trick as the pendulum's ruled backdrop, applied to aperture.
 */

export interface DepthRowRig {
  readonly markerDistancesM: readonly number[];
  readonly markerWidthM: number;
  readonly markerHeightM: number;
  /** Sideways stagger per marker, so nearer ones do not hide the ones behind. */
  readonly lateralStepM: number;
}

export const DEPTH_ROW_RIG: DepthRowRig = {
  markerDistancesM: [2, 3, 4.5, 7, 11],
  markerWidthM: 0.28,
  markerHeightM: 0.42,
  lateralStepM: 0.34,
};

/** Focus sits on the second marker, so there is depth both in front of and behind the subject. */
const FOCUS_DISTANCE_M = 3;

/** 85mm: the classic portrait length, and long enough for aperture to bite at these distances. */
const FOCAL_LENGTH_MM = 85;

function build(id: string, ev100: number): SceneSpec {
  const scene: Scene = {
    id,
    subjectDistanceM: FOCUS_DISTANCE_M,
    // The furthest marker is what "background blur" is judged against.
    backgroundDistanceM: 11,
    subjectSpeedMps: 0,
    imageWidthPx: 1000,
    sensor: FULL_FRAME,
    regions: [
      { id: "subject", ev100, frameShare: 0.3, inCentre: true, isSubject: true },
      { id: "surround", ev100, frameShare: 0.7, inCentre: false, isSubject: false },
    ],
  };

  return {
    id,
    scene,
    focalLengthMm: FOCAL_LENGTH_MM,
    focusDistanceM: FOCUS_DISTANCE_M,
    animated: false,
    effectiveSpeedMps: () => 0,
    speedFraction: () => 0,
  };
}

/** Outdoors, bright enough that aperture is free to be the variable under study. */
export const DEPTH_ROW = build("depth-row", 13);

/** The same rig in flat, dull light, where a wide aperture is needed for reasons of light too. */
export const DEPTH_ROW_OVERCAST = build("depth-row-overcast", 10);
