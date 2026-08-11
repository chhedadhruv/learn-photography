import { FULL_FRAME, type Scene } from "@/lib/sim/types";

/**
 * Kinematics for the pendulum rig, kept free of three.js so the motion the renderer draws and
 * the motion the rubric grades come from one set of equations.
 *
 * A pendulum's speed varies through its arc, while `motion.ts` models a constant speed. Rather
 * than forcing every capture to the bottom of the swing — which made the shutter button a
 * formality, since the bob was always in the same place — the exposure is centred on the moment
 * the player actually pressed it, and grading uses the *effective* speed: the distance the bob
 * genuinely covered during that exposure, divided by its duration.
 *
 * That is exact by construction rather than an approximation. The smear the renderer produces
 * spans precisely the displacement `effectiveSpeedMps` is derived from, so no matter where in
 * the arc the shot was taken, what is graded is what was drawn.
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
 * Distance actually travelled during an exposure centred on `centreSeconds`, following the true
 * arc rather than assuming a constant speed.
 */
export function travelDuringExposureM(
  rig: PendulumRig,
  shutterSeconds: number,
  centreSeconds = 0,
): number {
  const half = shutterSeconds / 2;
  return Math.abs(
    horizontalOffsetM(rig, centreSeconds + half) - horizontalOffsetM(rig, centreSeconds - half),
  );
}

/**
 * The constant speed that would produce exactly the smear this exposure produced.
 *
 * Feeding this to `subjectBlurPx` makes the graded blur identical to the rendered blur for any
 * moment in the swing — including near the turning points, where the bob is barely moving and a
 * peak-speed figure would badly overstate the blur.
 */
export function effectiveSpeedMps(
  rig: PendulumRig,
  shutterSeconds: number,
  centreSeconds: number,
): number {
  if (shutterSeconds <= 0) return 0;
  return travelDuringExposureM(rig, shutterSeconds, centreSeconds) / shutterSeconds;
}

/** Horizontal speed at an instant: d/dt of L·sin(θ). Zero at the turning points. */
export function instantaneousSpeedMps(rig: PendulumRig, t: number): number {
  const omega = angularFrequency(rig);
  const theta = angleAt(rig, t);
  return Math.abs(rig.lengthM * Math.cos(theta) * rig.amplitudeRad * omega * Math.cos(omega * t));
}

/**
 * How fast the bob was moving relative to its own maximum, 0–1.
 *
 * Lets the critique tell a player who froze the shot by catching the bob at the end of its
 * swing from one who did it with shutter speed. Both are real photographs; only one is the
 * lesson.
 */
export function speedFraction(rig: PendulumRig, shutterSeconds: number, centreSeconds: number) {
  return effectiveSpeedMps(rig, shutterSeconds, centreSeconds) / maxSpeedMps(rig);
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
