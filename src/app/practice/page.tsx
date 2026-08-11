import { LEVELS } from "@content/challenges";
import { DIAGNOSE_EXERCISES } from "@content/challenges/diagnose";
import { MATCH_EXERCISES } from "@content/challenges/match";
import { METERING_EXERCISES } from "@content/challenges/metering";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PracticeLadder } from "@/components/practice/PracticeLadder";
import { ProgressPanel } from "@/components/practice/ProgressPanel";
import { challengesForLevel } from "@/lib/challenges/registry";
import type { Challenge } from "@/lib/challenges/types";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Set the shutter, aperture and ISO yourself, take the shot, and get a critique of what your settings did. Fifteen challenges, one control at a time.",
};

export default function PracticeIndexPage() {
  // Grouped on the server so the ladder's markup is complete in the prerendered HTML, with or
  // without JavaScript. Progress fills in on the client.
  const challengesByLevel: Record<number, readonly Challenge[]> = {};
  for (const level of LEVELS) {
    challengesByLevel[level.level] = challengesForLevel(level.level);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/practice", label: "Practice" },
        ]}
      />

      <h1 className="mt-6 text-4xl font-semibold">Practice</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">
        Read the lesson, then prove it. Set the camera, take the shot, and find out what your
        settings actually did.
      </p>

      <div className="mt-10">
        <ProgressPanel />
      </div>

      <div className="mt-12">
        <PracticeLadder levels={LEVELS} challengesByLevel={challengesByLevel} />
      </div>

      <section aria-labelledby="other-ways" className="mt-16">
        <h2 id="other-ways" className="text-2xl font-semibold">
          Other ways to practise
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Not graded against a ladder — these are for poking at, and for reading photographs rather
          than making them.
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          <li>
            <Link
              href="/practice/sandbox"
              className="flex h-full flex-col rounded-md border border-rule p-4 transition-colors hover:border-rule-strong hover:bg-surface-raised"
            >
              <span className="font-semibold">Sandbox</span>
              <span className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Every control, seven scenes, a live histogram, and nothing keeping score.
              </span>
            </Link>
          </li>

          {MATCH_EXERCISES.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/practice/match/${exercise.id}`}
                className="flex h-full flex-col rounded-md border border-rule p-4 transition-colors hover:border-rule-strong hover:bg-surface-raised"
              >
                <span className="text-xs text-ink-faint">Match the photo</span>
                <span className="mt-0.5 font-semibold">{exercise.title}</span>
              </Link>
            </li>
          ))}

          {METERING_EXERCISES.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/practice/metering/${exercise.id}`}
                className="flex h-full flex-col rounded-md border border-rule p-4 transition-colors hover:border-rule-strong hover:bg-surface-raised"
              >
                <span className="text-xs text-ink-faint">Metering</span>
                <span className="mt-0.5 font-semibold">{exercise.title}</span>
              </Link>
            </li>
          ))}

          {DIAGNOSE_EXERCISES.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/practice/diagnose/${exercise.id}`}
                className="flex h-full flex-col rounded-md border border-rule p-4 transition-colors hover:border-rule-strong hover:bg-surface-raised"
              >
                <span className="text-xs text-ink-faint">Diagnose the mistake</span>
                <span className="mt-0.5 font-semibold">{exercise.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
