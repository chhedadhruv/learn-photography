import { FULL_FRAME, type Scene } from "@/lib/sim/types";
import type { SceneSpec } from "./types";

/**
 * A still life indoors, lit only by a window.
 *
 * ISO only becomes a real choice when there is not enough light, and only earns its cost when
 * the alternatives are already exhausted — which is why this scene is hand-held. A tripod would
 * let any shutter speed work and make ISO pointless, so `maxShutterSeconds` holds the automatic
 * choice at a speed a person can actually hold steady.
 */

export interface DimInteriorRig {
  readonly subjectDistanceM: number;
  readonly wallDistanceM: number;
  /** Objects on the table, as [lateral offset, height] in metres. */
  readonly objects: readonly (readonly [number, number])[];
}

export const DIM_INTERIOR_RIG: DimInteriorRig = {
  subjectDistanceM: 1.6,
  wallDistanceM: 3.2,
  objects: [
    [-0.28, 0.18],
    [-0.05, 0.26],
    [0.22, 0.14],
    [0.42, 0.21],
  ],
};

const FOCAL_LENGTH_MM = 50;

/**
 * The reciprocal rule for a 50mm gives 1/50s; the ladder's nearest safe rung is 1/64. Anything
 * slower and camera shake, not ISO, becomes the thing that ruins the picture.
 */
const MAX_HANDHELD_SECONDS = 1 / 64;

function build(id: string, ev100: number): SceneSpec {
  const scene: Scene = {
    id,
    subjectDistanceM: DIM_INTERIOR_RIG.subjectDistanceM,
    backgroundDistanceM: DIM_INTERIOR_RIG.wallDistanceM,
    subjectSpeedMps: 0,
    imageWidthPx: 1000,
    sensor: FULL_FRAME,
    regions: [
      { id: "subject", ev100, frameShare: 0.35, inCentre: true, isSubject: true },
      { id: "room", ev100: ev100 - 1, frameShare: 0.65, inCentre: false, isSubject: false },
    ],
  };

  return {
    id,
    scene,
    focalLengthMm: FOCAL_LENGTH_MM,
    focusDistanceM: DIM_INTERIOR_RIG.subjectDistanceM,
    animated: false,
    effectiveSpeedMps: () => 0,
    speedFraction: () => 0,
    maxShutterSeconds: MAX_HANDHELD_SECONDS,
  };
}

/** Overcast daylight through a window: dim, but not desperate. */
export const DIM_INTERIOR = build("dim-interior", 7);

/** Evening, lamps only. Here even ISO 6400 is a stretch, which is the point. */
export const DIM_INTERIOR_EVENING = build("dim-interior-evening", 5);
