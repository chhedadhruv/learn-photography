import type { Scene } from "@/lib/sim/types";

/**
 * The physical description of a scene, with no three.js in sight.
 *
 * Deliberately split from the 3D rig that draws it: this half is imported by the challenge
 * registry, which runs on the server during the build, and must not drag the renderer with it.
 * The rig lives in `render/rigs` and is only reachable from the lazy chunk.
 */
export interface SceneSpec {
  readonly id: string;
  readonly scene: Scene;
  readonly focalLengthMm: number;
  readonly focusDistanceM: number;
  /** Whether anything moves, and therefore whether the viewfinder should animate. */
  readonly animated: boolean;
  /**
   * The constant speed that reproduces exactly the smear an exposure centred on
   * `centreSeconds` produces. Zero for a still scene.
   */
  effectiveSpeedMps(shutterSeconds: number, centreSeconds: number): number;
  /** Fraction of the subject's peak speed during that exposure, 0–1. */
  speedFraction(shutterSeconds: number, centreSeconds: number): number;
  /**
   * Longest hand-holdable exposure for this scene, when the challenge is meant to be shot
   * hand-held. Constrains the automatic choice so a level cannot be solved with a tripod-slow
   * shutter the lesson never mentioned.
   */
  readonly maxShutterSeconds?: number;
}
