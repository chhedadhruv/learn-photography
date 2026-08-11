import { LEVELS } from "@content/challenges";
import type { LevelDefinition } from "@/lib/sim/progress";
import { challengesForLevel } from "./registry";

/**
 * Six stars of a possible nine opens the next level.
 *
 * Deliberately not nine. Requiring perfection would mean one stubborn challenge blocks the whole
 * ladder, and the point is to keep someone moving through the ideas rather than to certify them
 * on each one. There is still a reason to go back: the badges want three stars everywhere.
 */
const STARS_TO_ADVANCE = 6;

export const LEVEL_DEFINITIONS: readonly LevelDefinition[] = LEVELS.map((level) => ({
  level: level.level,
  name: level.name,
  challengeIds: challengesForLevel(level.level).map((challenge) => challenge.id),
  starsToUnlockNext: STARS_TO_ADVANCE,
}));

export function levelDefinition(level: number): LevelDefinition | undefined {
  return LEVEL_DEFINITIONS.find((definition) => definition.level === level);
}

/** Stars still needed in `level` before the one after it opens. */
export function starsStillNeeded(level: number, held: number): number {
  const definition = levelDefinition(level);
  if (!definition) return 0;
  return Math.max(0, definition.starsToUnlockNext - held);
}
