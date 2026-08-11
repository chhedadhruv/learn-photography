import Link from "next/link";
import { DIFFICULTY_LABELS, getCategory } from "@/lib/content/categories";
import type { Lesson } from "@/lib/content/schema";

export function LessonCard({ lesson }: { readonly lesson: Lesson }) {
  const category = getCategory(lesson.frontmatter.category);

  return (
    <article className="group border-b border-rule py-6 transition-colors hover:border-rule-strong">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
        {category ? <span>{category.name}</span> : null}
        <span aria-hidden="true">·</span>
        <span>{DIFFICULTY_LABELS[lesson.frontmatter.difficulty]}</span>
        <span aria-hidden="true">·</span>
        <span>{lesson.readingMinutes} min read</span>
        {lesson.frontmatter.draft ? (
          <span className="ml-1 rounded border border-rule-strong px-1.5 py-0.5">Draft</span>
        ) : null}
      </div>

      <h3 className="mt-2 text-xl font-semibold">
        {/* The whole card is not a link: a nested-link card is a keyboard trap and reads badly
            in a screen reader's link list. The title is the single, well-labelled target. */}
        <Link href={`/learn/${lesson.slug}`} className="transition-colors group-hover:text-accent">
          {lesson.frontmatter.title}
        </Link>
      </h3>

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
        {lesson.frontmatter.description}
      </p>
    </article>
  );
}
