"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LEVEL_DEFINITIONS } from "@/lib/challenges/levels";
import {
  decodeProgress,
  earnedBadges,
  encodeProgress,
  isLevelUnlocked,
  recordAttempt,
  starsFor,
  totalStars,
  totalXp,
  type Badge,
  type ProgressState,
} from "@/lib/sim/progress";
import {
  clearProgress,
  getProgressServerSnapshot,
  getProgressSnapshot,
  subscribeToProgress,
  writeProgress,
} from "./store";

export interface ProgressApi {
  readonly state: ProgressState;
  readonly totalStars: number;
  readonly totalXp: number;
  readonly badges: readonly Badge[];
  starsFor(challengeId: string): number;
  starsInLevel(level: number): number;
  isUnlocked(level: number): boolean;
  record(challengeId: string, stars: number): void;
  reset(): void;
  exportCode(): string;
  /** Returns false when the code is unrecognised, so the caller can say so. */
  importCode(code: string): boolean;
}

/**
 * Reads progress reactively and writes it back.
 *
 * On the server, and on the first client render, this reports an empty slate — so the markup
 * matches and hydration is clean. The real values arrive immediately afterwards, which is why
 * anything that would shift layout when they do needs to reserve its space.
 */
export function useProgress(): ProgressApi {
  const state = useSyncExternalStore(
    subscribeToProgress,
    getProgressSnapshot,
    getProgressServerSnapshot,
  );

  const record = useCallback((challengeId: string, stars: number) => {
    const current = getProgressSnapshot();
    const next = recordAttempt(current, challengeId, stars);
    // recordAttempt returns the same object when nothing improved, so a worse retry writes
    // nothing and triggers no re-render.
    if (next !== current) writeProgress(next);
  }, []);

  const importCode = useCallback((code: string) => {
    const imported = decodeProgress(code);
    if (!imported) return false;
    writeProgress(imported);
    return true;
  }, []);

  return {
    state,
    totalStars: totalStars(state),
    totalXp: totalXp(state),
    badges: earnedBadges(state, LEVEL_DEFINITIONS),
    starsFor: (challengeId) => starsFor(state, challengeId),
    starsInLevel: (level) => {
      const definition = LEVEL_DEFINITIONS.find((entry) => entry.level === level);
      return definition ? totalStars(state, definition.challengeIds) : 0;
    },
    isUnlocked: (level) => isLevelUnlocked(state, LEVEL_DEFINITIONS, level),
    record,
    reset: clearProgress,
    exportCode: () => encodeProgress(state),
    importCode,
  };
}
