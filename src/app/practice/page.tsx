import { LEVELS } from "@content/challenges";
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
    </div>
  );
}
