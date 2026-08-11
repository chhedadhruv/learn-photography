import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CHALLENGES } from "@/lib/challenges/registry";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Set the shutter, aperture and ISO yourself, take the shot, and get a critique of what your settings did.",
};

/**
 * Placeholder hub. Phase 6 replaces this with the level ladder, XP and badges — for now it lists
 * what exists so the challenge route is reachable.
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

      <ul className="mt-10 flex flex-col">
        {CHALLENGES.map((challenge) => (
          <li key={challenge.id} className="border-b border-rule py-6">
            <p className="text-xs text-ink-faint">Level {challenge.level}</p>
            <h2 className="mt-1 text-xl font-semibold">
              <Link href={`/practice/${challenge.id}`} className="hover:text-accent">
                {challenge.title}
              </Link>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {challenge.brief}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
