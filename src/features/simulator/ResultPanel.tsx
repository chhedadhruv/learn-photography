"use client";

import Link from "next/link";
import type { ScoreResult } from "@/lib/sim/scoring";

/**
 * The critique.
 *
 * Presented as the primary result, with the stars as a small heading decoration — a canvas is
 * invisible to assistive tech, so this text is the only feedback some readers get, and it is the
 * feedback that actually teaches anyone.
 */
export function ResultPanel({
  result,
  description,
  note,
  onRetake,
  nextHref,
  nextLabel,
}: {
  readonly result: ScoreResult;
  /** Plain-language account of the photograph, for readers who cannot see the canvas. */
  readonly description: string;
  /** Optional coaching about *how* the result was achieved, not just whether it passed. */
  readonly note?: string | undefined;
  readonly onRetake: () => void;
  /** Where to go next once this is solved. Absent on the last challenge. */
  readonly nextHref?: string | undefined;
  readonly nextLabel?: string | undefined;
}) {
  return (
    <section
      aria-labelledby="result-heading"
      className="rounded-md border border-rule bg-surface-raised p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 id="result-heading" className="text-lg font-semibold">
          {result.headline}
        </h3>
        <p className="text-sm" aria-label={`${result.stars.toString()} out of 3 stars`}>
          <span aria-hidden="true" className="text-[var(--color-tungsten)]">
            {"★".repeat(result.stars)}
            <span className="text-ink-faint">{"☆".repeat(3 - result.stars)}</span>
          </span>
        </p>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p>

      {note === undefined ? null : (
        <p className="mt-3 border-l-2 border-l-[var(--color-tungsten)] pl-3 text-sm leading-relaxed text-ink-muted">
          {note}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {result.goals.map((goal) => (
          <li key={goal.type} className="flex gap-3 text-sm">
            <span aria-hidden="true" className={goal.passed ? "text-[#2f7d32]" : "text-[#c4402a]"}>
              {goal.passed ? "✓" : "✗"}
            </span>
            <span>
              {/* The pass/fail state is in text, not only in the tick's colour. */}
              <span className="sr-only">{goal.passed ? "Met: " : "Not met: "}</span>
              <span className="font-mono text-xs text-ink-faint">{goal.actual}</span>
              <span className="mt-0.5 block leading-relaxed text-ink-muted">{goal.critique}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Succeeding and failing want different offers. Three stars and a "Try again" button
          reads as though nothing happened; the way forward should be the obvious one, with
          another attempt still available for anyone who wants to explore. */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {result.stars === 3 && nextHref !== undefined ? (
          <>
            <Link
              href={nextHref}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface"
            >
              {nextLabel ?? "Next challenge"} →
            </Link>
            <button type="button" onClick={onRetake} className="text-sm text-ink-muted underline">
              Try it again
            </button>
          </>
        ) : result.stars === 3 ? (
          <>
            <Link
              href="/practice"
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface"
            >
              Back to the ladder
            </Link>
            <button type="button" onClick={onRetake} className="text-sm text-ink-muted underline">
              Try it again
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onRetake}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface"
          >
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
