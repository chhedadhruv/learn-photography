import { freezeThePendulum } from "@content/challenges/freeze-the-pendulum";
import { PENDULUM_FOCAL_LENGTH_MM, PENDULUM_SCENE } from "@/features/simulator/scene/pendulum";
import type { Scene } from "@/lib/sim/types";
import { z } from "zod";
import { challengeSchema, type Challenge } from "./types";

/**
 * Every challenge, validated at import time. A malformed definition stops the build rather than
 * reaching a player as an unwinnable level.
 */
const DEFINITIONS: readonly Challenge[] = [freezeThePendulum];

for (const challenge of DEFINITIONS) {
  const result = challengeSchema.safeParse(challenge);
  if (!result.success) {
    throw new Error(`Invalid challenge "${challenge.id}"\n\n${z.prettifyError(result.error)}`);
  }
}

export const CHALLENGES = DEFINITIONS;

/**
 * Scene metadata by id. Scenes are the physical description the simulation core reads; the 3D
 * rig that draws them lives separately in `features/simulator/render`.
 */
const SCENES: Readonly<Record<string, { scene: Scene; focalLengthMm: number }>> = {
  pendulum: { scene: PENDULUM_SCENE, focalLengthMm: PENDULUM_FOCAL_LENGTH_MM },
};

export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id);
}

export function getSceneFor(challenge: Challenge): { scene: Scene; focalLengthMm: number } {
  const entry = SCENES[challenge.sceneId];
  if (!entry) {
    throw new Error(`Challenge "${challenge.id}" names an unknown scene "${challenge.sceneId}".`);
  }
  return entry;
}
