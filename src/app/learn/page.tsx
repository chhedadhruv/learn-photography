import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LessonCard } from "@/components/lesson/LessonCard";
import { CATEGORIES } from "@/lib/content/categories";
import { getAllLessons } from "@/lib/content/loader";

export const metadata: Metadata = {
  title: "Lessons",
  description:
    "Photography lessons for beginners, grouped by topic — camera basics, exposure and settings, composition, lighting, genres and editing.",
};

export default async function LearnIndexPage() {
  const lessons = await getAllLessons();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/learn", label: "Lessons" },
        ]}
      />

      <h1 className="mt-6 text-4xl font-semibold">Lessons</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">
        Start anywhere, or work through a topic in order.
      </p>

      <section aria-labelledby="topics" className="mt-12">
        <h2
          id="topics"
          className="text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase"
        >
          Topics
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/learn/${category.slug}`}
                className="block h-full rounded-md border border-rule p-4 transition-colors hover:border-rule-strong hover:bg-surface-raised"
              >
                <span className="font-semibold">{category.name}</span>
                <span className="mt-1 block text-sm text-ink-muted">{category.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="all-lessons" className="mt-16">
        <h2 id="all-lessons" className="text-2xl font-semibold">
          All lessons
        </h2>
        {lessons.length === 0 ? (
          <p className="mt-4 text-ink-muted">
            No lessons published yet. Add an <code>.mdx</code> file to <code>content/lessons/</code>{" "}
            and it appears here.
          </p>
        ) : (
          <div className="mt-4">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.slug} lesson={lesson} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
