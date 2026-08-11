"use client";

import Link from "next/link";
import type { LevelInfo } from "@content/challenges";
import { starsStillNeeded } from "@/lib/challenges/levels";
import type { Challenge } from "@/lib/challenges/types";
import { useProgress } from "@/lib/progress/useProgress";
import { Stars } from "./Stars";

interface PracticeLadderProps {
  readonly levels: readonly LevelInfo[];
  /** Grouped by level on the server, so the markup is complete before any JavaScript runs. */
  readonly challengesByLevel: Readonly<Record<number, readonly Challenge[]>>;
}

export function PracticeLadder({ levels, challengesByLevel }: PracticeLadderProps) {
  const progress = useProgress();

  return (
    <div className="flex flex-col gap-12">
      {levels.map((level) => {
        const challenges = challengesByLevel[level.level] ?? [];
        const held = progress.starsInLevel(level.level);
        const available = challenges.length * 3;
        const unlocked = progress.isUnlocked(level.level);
        const needed = starsStillNeeded(level.level - 1, progress.starsInLevel(level.level - 1));

        return (
          <section key={level.level} aria-labelledby={`level-${level.level.toString()}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-semibold tracking-[0.1em] text-ink-faint uppercase">
                  Level {level.level}
                </span>
                <h2 id={`level-${level.level.toString()}`} className="text-2xl font-semibold">
                  {level.name}
                </h2>
              </div>
              <p className="text-sm text-ink-muted tabular-nums">
                {held} / {available} stars
              </p>
            </div>

            <p className="mt-1 text-sm text-ink-muted">{level.teaches}</p>

            {/* Progress towards this level's own completion, not towards unlocking it. */}
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={available}
              aria-valuenow={held}
              aria-label={`Level ${level.level.toString()} progress`}
              className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
            >
              <div
                className="h-full bg-[var(--color-tungsten)] transition-[width]"
                style={{ width: `${(available === 0 ? 0 : (held / available) * 100).toString()}%` }}
              />
            </div>

            {!unlocked && (
              <p className="mt-3 text-sm text-ink-muted">
                <span aria-hidden="true">🔒 </span>
                {needed} more {needed === 1 ? "star" : "stars"} in Level{" "}
                {(level.level - 1).toString()} opens this. You can still try it now.
              </p>
            )}

            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {challenges.map((challenge) => (
                <li key={challenge.id}>
                  <Link
                    href={`/practice/${challenge.id}`}
                    className={[
                      "flex h-full flex-col rounded-md border p-4 transition-colors",
                      "border-rule hover:border-rule-strong hover:bg-surface-raised",
                      unlocked ? "" : "opacity-70",
                    ].join(" ")}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-semibold">{challenge.title}</span>
                      <Stars count={progress.starsFor(challenge.id)} />
                    </span>
                    <span className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                      {challenge.brief.split(".")[0]}.
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
