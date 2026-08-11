import type { Metadata } from "next";
import Link from "next/link";
import { ApertureMark } from "@/components/brand/ApertureMark";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHALLENGES } from "@/lib/challenges/registry";
import { CATEGORIES } from "@/lib/content/categories";
import { getAllLessons } from "@/lib/content/loader";
import { getLearningPath } from "@/lib/content/path";
import { websiteJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Learn Photography — Camera Basics, Exposure and Care for Beginners",
  description:
    "Learn what your camera is actually doing, then prove it in a browser-based camera simulator. Twenty-five lessons and fifteen practice challenges, free.",
  path: "/",
});

export default async function Home() {
  const [lessons, path] = await Promise.all([getAllLessons(), getLearningPath()]);
  const firstThree = path.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <JsonLd data={websiteJsonLd()} />

      {/* The thesis: this site is about doing, not only reading. */}
      <section className="py-16 sm:py-24">
        <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold sm:text-6xl">
          Learn what your camera is actually doing.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          Read the lesson, then set the shutter, aperture and ISO yourself, press the shutter, and
          get back a photograph and a critique of what your settings did to it.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/start-here"
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-surface"
          >
            Start here
          </Link>
          <Link
            href="/practice"
            className="rounded-md border border-rule-strong px-5 py-2.5 text-sm font-medium hover:bg-surface-raised"
          >
            Try the simulator
          </Link>
        </div>

        <p className="mt-6 text-sm text-ink-faint">
          {lessons.length} lessons · {CHALLENGES.length} practice challenges · free, and no account
        </p>
      </section>

      {/* Why this exists, stated plainly rather than as a feature list. */}
      <section aria-labelledby="why" className="border-t border-rule py-14">
        <h2 id="why" className="text-2xl font-semibold">
          Reading about shutter speed is not the same as seeing it
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="font-semibold">One control at a time</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              The challenges unlock shutter speed first, then aperture, then ISO, then combinations
              — so each variable is learned on its own before it has to be juggled.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">A real critique, not a score</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Every shot comes back with what worked and what did not, naming the setting you chose
              and the one to try instead. The stars are decoration.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Nothing to sign up for</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              No account, no newsletter, no tracking. Your progress is stored in your own browser
              and goes nowhere else.
            </p>
          </div>
        </div>
      </section>

      {/* The path, as a genuine sequence — numbering here carries information. */}
      {firstThree.length > 0 && (
        <section aria-labelledby="begin" className="border-t border-rule py-14">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="begin" className="text-2xl font-semibold">
              If you do not know where to begin
            </h2>
            <Link href="/start-here" className="text-sm text-accent underline">
              See the whole path
            </Link>
          </div>

          <ol className="mt-6 flex flex-col">
            {firstThree.map((step) => (
              <li key={step.lesson.slug} className="flex gap-5 border-b border-rule py-5">
                <span
                  aria-hidden="true"
                  className="text-xl font-semibold text-ink-faint tabular-nums"
                >
                  {step.position.toString().padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold">
                    <Link href={`/learn/${step.lesson.slug}`} className="hover:text-accent">
                      {step.lesson.frontmatter.title}
                    </Link>
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
                    {step.lesson.frontmatter.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="topics" className="border-t border-rule py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="topics" className="text-2xl font-semibold">
            Or pick a topic
          </h2>
          <Link href="/learn" className="text-sm text-accent underline">
            All {lessons.length} lessons
          </Link>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/learn/${category.slug}`}
                className="flex h-full flex-col rounded-md border border-rule p-4 transition-colors hover:border-rule-strong hover:bg-surface-raised"
              >
                <span className="font-semibold">{category.name}</span>
                <span className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {category.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="practice"
        className="mb-20 rounded-md border border-rule bg-surface-raised p-6 sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="hidden text-accent-mark sm:block">
            <ApertureMark size={40} decorative />
          </span>
          <div>
            <h2 id="practice" className="text-2xl font-semibold">
              Then prove it
            </h2>
            <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
              Fifteen graded challenges, a free-play sandbox with a live histogram, and exercises in
              reading photographs — matching a shot you are shown, and working out what went wrong
              with one.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/practice"
                className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface"
              >
                The challenges
              </Link>
              <Link
                href="/practice/sandbox"
                className="rounded-md border border-rule-strong px-4 py-2 text-sm font-medium"
              >
                Free-play sandbox
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
