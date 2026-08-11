import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { DIFFICULTY_LABELS, getCategory } from "@/lib/content/categories";
import { getLearningPath } from "@/lib/content/path";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const CRUMBS = [
  { href: "/", label: "Home" },
  { href: "/start-here", label: "Start here" },
];

export const metadata: Metadata = buildMetadata({
  title: "Start here",
  description:
    "A suggested order to work through photography from the beginning — what a camera does, then what to do about it.",
  path: "/start-here",
});

export default async function StartHerePage() {
  const path = await getLearningPath();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Breadcrumbs crumbs={CRUMBS} />

      <h1 className="mt-6 text-4xl font-semibold">Start here</h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-muted">
        If you do not know where to begin, begin here. Everything is readable on its own, so
        skipping around is fine — this is just the order that makes each piece easiest.
      </p>

      {path.length === 0 ? (
        <p className="mt-10 text-ink-muted">The path has not been set out yet.</p>
      ) : (
        <ol className="mt-12 flex flex-col">
          {path.map((step) => {
            const category = getCategory(step.lesson.frontmatter.category);

            return (
              <li key={step.lesson.slug} className="flex gap-5 border-b border-rule py-6">
                {/* Numbered because the order genuinely carries information here — unlike a
                    listing, where numbering would be decoration. */}
                <span
                  aria-hidden="true"
                  className="text-2xl font-semibold text-ink-faint tabular-nums"
                >
                  {step.position.toString().padStart(2, "0")}
                </span>

                <div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-ink-faint">
                    {category && <span>{category.name}</span>}
                    <span aria-hidden="true">·</span>
                    <span>{DIFFICULTY_LABELS[step.lesson.frontmatter.difficulty]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{step.lesson.readingMinutes} min read</span>
                  </div>

                  <h2 className="mt-1.5 text-xl font-semibold">
                    <Link href={`/learn/${step.lesson.slug}`} className="hover:text-accent">
                      {step.lesson.frontmatter.title}
                    </Link>
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {step.lesson.frontmatter.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-10 text-sm text-ink-muted">
        Reading is half of it.{" "}
        <Link href="/practice" className="text-accent underline">
          The practice challenges
        </Link>{" "}
        are the other half.
      </p>
    </div>
  );
}
