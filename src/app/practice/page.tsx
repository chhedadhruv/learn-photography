import { LEVELS } from "@content/challenges";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { challengesForLevel } from "@/lib/challenges/registry";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Set the shutter, aperture and ISO yourself, take the shot, and get a critique of what your settings did. Fifteen challenges, one control at a time.",
};

/**
 * The ladder. Phase 6 adds XP, stars and locking; for now every challenge is open, grouped by
 * the control it teaches.
 */
export default function PracticeIndexPage() {
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

      <div className="mt-12 flex flex-col gap-12">
        {LEVELS.map((level) => {
          const challenges = challengesForLevel(level.level);

          return (
            <section key={level.level} aria-labelledby={`level-${level.level.toString()}`}>
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-semibold tracking-[0.1em] text-ink-faint uppercase">
                  Level {level.level}
                </span>
                <h2 id={`level-${level.level.toString()}`} className="text-2xl font-semibold">
                  {level.name}
                </h2>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{level.teaches}</p>

              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {challenges.map((challenge) => (
                  <li key={challenge.id}>
                    <Link
                      href={`/practice/${challenge.id}`}
                      className="flex h-full flex-col rounded-md border border-rule p-4 transition-colors hover:border-rule-strong hover:bg-surface-raised"
                    >
                      <span className="font-semibold">{challenge.title}</span>
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
    </div>
  );
}
