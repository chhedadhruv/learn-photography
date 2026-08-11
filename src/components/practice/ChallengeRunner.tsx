"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { starsStillNeeded } from "@/lib/challenges/levels";
import type { Challenge } from "@/lib/challenges/types";
import { useProgress } from "@/lib/progress/useProgress";
import { SimulatorLoader } from "./SimulatorLoader";
import { Stars } from "./Stars";

/**
 * Wraps a challenge with its progress: records the score, and shows the gate if the level has
 * not been reached.
 *
 * The gate is soft by design. Pages are static and progress is local, so a locked level cannot
 * be enforced server-side anyway — and a hard block would mean a link shared with a friend
 * dead-ends, and that clearing site data strands someone behind a wall they had already passed.
 * Better to say what the ladder suggests and let an adult decide.
 */
export function ChallengeRunner({
  challenge,
  sceneId,
}: {
  readonly challenge: Challenge;
  readonly sceneId: string;
}) {
  const progress = useProgress();
  const [skipped, setSkipped] = useState(false);

  const unlocked = progress.isUnlocked(challenge.level);
  const best = progress.starsFor(challenge.id);

  const handleScored = useCallback(
    (stars: number) => {
      progress.record(challenge.id, stars);
    },
    [challenge.id, progress],
  );

  if (!unlocked && !skipped) {
    const needed = starsStillNeeded(
      challenge.level - 1,
      progress.starsInLevel(challenge.level - 1),
    );

    return (
      <div className="rounded-md border border-rule p-6">
        <p className="text-xs font-semibold tracking-[0.1em] text-ink-faint uppercase">
          Level {challenge.level}
        </p>
        <h2 className="mt-2 text-xl font-semibold">Not reached yet</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          Earning {needed} more {needed === 1 ? "star" : "stars"} in Level{" "}
          {(challenge.level - 1).toString()} opens this level. That is the order the ideas build in
          — but nothing is stopping you.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/practice"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface"
          >
            Back to the ladder
          </Link>
          <button
            type="button"
            onClick={() => {
              setSkipped(true);
            }}
            className="rounded-md border border-rule-strong px-4 py-2 text-sm font-medium"
          >
            Skip ahead anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {best > 0 && (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          Your best so far: <Stars count={best} />
        </p>
      )}

      <SimulatorLoader challenge={challenge} sceneId={sceneId} onScored={handleScored} autoStart />
    </div>
  );
}
