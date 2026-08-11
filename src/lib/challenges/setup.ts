import type { SceneSpec } from "@/features/simulator/scene";
import {
  autoFillLockedControls,
  offsetUnlockedControls,
  solveExposure,
  subjectEv100,
} from "@/lib/sim/meter";
import { evaluateExposure } from "@/lib/sim/exposure";
import type { CameraSettings } from "@/lib/sim/types";
import type { Challenge } from "./types";

/**
 * Works out the settings a challenge opens on.
 *
 * Shared by the simulator and by the tests that prove every challenge is fair, so the properties
 * CI checks are the ones a player actually meets — a separate implementation in the test would
 * verify a fiction.
 *
 * The order matters:
 *
 * 1. Choose sensible automatic values for the locked controls.
 * 2. Apply any values the challenge pins explicitly. With one control unlocked, exposure fixes
 *    that control to a single value, so where the locked ones sit decides what the answer *is*.
 *    Pinning is how an author aims the answer at f/2.8 rather than wherever f/5.6 happens to
 *    put it.
 * 3. Solve for the unlocked controls, giving the intended answer.
 * 4. Move the unlocked controls away from it, so there is something to work out.
 */
export interface ChallengeSetup {
  /** Where the player starts: locked values correct, unlocked values deliberately wrong. */
  readonly start: CameraSettings;
  /** A setting of the unlocked controls that exposes correctly. */
  readonly answer: CameraSettings;
}

export function setUpChallenge(challenge: Challenge, spec: SceneSpec): ChallengeSetup | null {
  const targetEv100 = subjectEv100(spec.scene);

  const auto = autoFillLockedControls({
    scene: spec.scene,
    unlocked: challenge.unlocked,
    focalLengthMm: spec.focalLengthMm,
    focusDistanceM: spec.focusDistanceM,
    ...(spec.maxShutterSeconds === undefined ? {} : { maxShutterSeconds: spec.maxShutterSeconds }),
  });

  const base: CameraSettings = {
    ...(auto ?? {
      shutterSeconds: 1 / 128,
      aperture: 5.656854249492381,
      iso: 100,
      focalLengthMm: spec.focalLengthMm,
      focusDistanceM: spec.focusDistanceM,
    }),
    ...challenge.locked,
  };

  const answer = solveExposure(base, challenge.unlocked, targetEv100, spec.maxShutterSeconds);
  if (!answer) return null;

  // Clamping against the end of a ladder can land back on the answer; try the other direction
  // rather than opening on a solved challenge.
  const offsets = [
    challenge.startOffsetStops,
    -challenge.startOffsetStops,
    challenge.startOffsetStops - 1,
    1 - challenge.startOffsetStops,
  ];

  for (const offset of offsets) {
    const candidate = offsetUnlockedControls(answer, challenge.unlocked, offset);
    if (evaluateExposure(candidate, targetEv100).verdict !== "correct") {
      return { start: candidate, answer };
    }
  }

  return { start: answer, answer };
}
