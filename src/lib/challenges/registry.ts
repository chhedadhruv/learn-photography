import { z } from "zod";
import { CHALLENGE_DEFINITIONS } from "@content/challenges";
import { getSceneSpec, type SceneSpec } from "@/features/simulator/scene";
import { challengeSchema, type Challenge } from "./types";

/**
 * Every challenge, validated at import time. A malformed definition stops the build rather than
 * reaching a player as an unwinnable level.
 *
 * Only scene *physics* is imported here — the registry runs on the server during the build, and
 * the 3D rigs stay behind the lazy chunk.
 */
for (const challenge of CHALLENGE_DEFINITIONS) {
  const result = challengeSchema.safeParse(challenge);
  if (!result.success) {
    throw new Error(`Invalid challenge "${challenge.id}"\n\n${z.prettifyError(result.error)}`);
  }

  if (!getSceneSpec(challenge.sceneId)) {
    throw new Error(`Challenge "${challenge.id}" names an unknown scene "${challenge.sceneId}".`);
  }
}

const seen = new Set<string>();
for (const challenge of CHALLENGE_DEFINITIONS) {
  if (seen.has(challenge.id)) {
    throw new Error(`Two challenges share the id "${challenge.id}".`);
  }
  seen.add(challenge.id);
}

export const CHALLENGES: readonly Challenge[] = CHALLENGE_DEFINITIONS;

export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id);
}

export function getSceneFor(challenge: Challenge): SceneSpec {
  const spec = getSceneSpec(challenge.sceneId);
  if (!spec) {
    throw new Error(`Challenge "${challenge.id}" names an unknown scene "${challenge.sceneId}".`);
  }
  return spec;
}

/**
 * The challenge after this one, in ladder order.
 *
 * Used to turn a finished challenge into a way forward rather than a dead end — three stars and
 * a "Try again" button is a strange thing to offer someone who has just succeeded.
 */
export function getNextChallenge(id: string): Challenge | undefined {
  const index = CHALLENGES.findIndex((challenge) => challenge.id === id);
  if (index === -1) return undefined;
  return CHALLENGES[index + 1];
}

export function challengesForLevel(level: number): readonly Challenge[] {
  return CHALLENGES.filter((challenge) => challenge.level === level);
}
