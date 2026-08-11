import { FULL_FRAME, type Scene } from "@/lib/sim/types";

/**
 * Kinematics for the pendulum rig, kept free of three.js so the motion the renderer draws and
 * the motion the rubric grades come from one set of equations.
 *
 * A pendulum's speed varies through its arc, while `motion.ts` models a constant speed. The
 * reconciliation is that capture is always centred on the bottom of the swing, where speed is at
 * its maximum and, over any shutter speed this challenge offers, very nearly constant.
 * `pendulum.test.ts` measures that divergence rather than assuming it.
 */

const GRAVITY = 9.81;

export interface PendulumRig {
  /** Length from pivot to the centre of the bob, metres. */
  readonly lengthM: number;
  /** Angular amplitude, radians. Small enough for the simple-harmonic approximation to hold. */
  readonly amplitudeRad: number;
  readonly bobRadiusM: number;
  /** Distance from camera to the bob at the bottom of its swing, metres. */
  readonly bobDistanceM: number;
  readonly backdropDistanceM: number;
  /** Spacing of the backdrop's rules, metres. Gives the smear something to be measured against. */
  readonly ruleSpacingM: number;
}

export const PENDULUM_RIG: PendulumRig = {
  lengthM: 1.2,
  amplitudeRad: 0.35,
  bobRadiusM: 0.06,
  bobDistanceM: 3,
  backdropDistanceM: 4.5,
  ruleSpacingM: 0.1,
};

/** Period of a small-amplitude pendulum: T = 2π√(L/g). */
export function periodSeconds(rig: PendulumRig): number {
  return 2 * Math.PI * Math.sqrt(rig.lengthM / GRAVITY);
}

export function angularFrequency(rig: PendulumRig): number {
  return (2 * Math.PI) / periodSeconds(rig);
}

/**
 * Angle at time `t`, measured from vertical. Phase is chosen so `t = 0` is the bottom of the
 * swing — the instant capture is centred on.
 */
export function angleAt(rig: PendulumRig, t: number): number {
  return rig.amplitudeRad * Math.sin(angularFrequency(rig) * t);
}

/** Horizontal offset of the bob from the rest position, metres. */
export function horizontalOffsetM(rig: PendulumRig, t: number): number {
  return rig.lengthM * Math.sin(angleAt(rig, t));
}

/** Speed at the bottom of the swing, where the exposure is centred. */
export function maxSpeedMps(rig: PendulumRig): number {
  return rig.lengthM * rig.amplitudeRad * angularFrequency(rig);
}

/**
 * Distance actually travelled during an exposure centred on the bottom of the swing, following
 * the true arc rather than assuming constant speed.
 */
export function travelDuringExposureM(rig: PendulumRig, shutterSeconds: number): number {
  const half = shutterSeconds / 2;
  return Math.abs(horizontalOffsetM(rig, half) - horizontalOffsetM(rig, -half));
}

/** The scene as the simulation core sees it: brightness, distances and speed. */
export const PENDULUM_SCENE: Scene = {
  id: "pendulum",
  subjectDistanceM: PENDULUM_RIG.bobDistanceM,
  backgroundDistanceM: PENDULUM_RIG.backdropDistanceM,
  subjectSpeedMps: maxSpeedMps(PENDULUM_RIG),
  imageWidthPx: 1000,
  sensor: FULL_FRAME,
  // Bright overcast daylight. Chosen so the shutter that exposes correctly at the automatic
  // f/5.6 and ISO 100 is also fast enough to freeze the bob — the two lessons agree rather than
  // fight, which is what a first level needs.
  regions: [
    { id: "bob", ev100: 14, frameShare: 0.2, inCentre: true, isSubject: true },
    { id: "backdrop", ev100: 14, frameShare: 0.8, inCentre: false, isSubject: false },
  ],
};

export const PENDULUM_FOCAL_LENGTH_MM = 50;
