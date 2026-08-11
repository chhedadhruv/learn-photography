import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LessonCard } from "@/components/lesson/LessonCard";
import { LessonFaqs } from "@/components/lesson/LessonFaqs";
import { ReadingProgress } from "@/components/lesson/ReadingProgress";
import { TableOfContents } from "@/components/lesson/TableOfContents";
import {
  CATEGORIES,
  DIFFICULTY_LABELS,
  getCategory,
  isCategorySlug,
} from "@/lib/content/categories";
import {
  getAllLessons,
  getLesson,
  getLessonsByCategory,
  getRelatedLessons,
} from "@/lib/content/loader";
import { MdxContent } from "@/lib/content/mdx";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, howToJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

/**
 * Flat URLs put lessons and category indexes in the same namespace, so this route resolves
 * either. `loader.ts` fails the build if a lesson ever claims a category's slug, which is what
 * makes the category-first lookup below unambiguous.
 */
export async function generateStaticParams() {
  const lessons = await getAllLessons();

  return [
    ...CATEGORIES.map((category) => ({ slug: category.slug })),
    ...lessons.map((lesson) => ({ slug: lesson.slug })),
  ];
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  const category = getCategory(slug);
  if (category) {
    return buildMetadata({
      title: category.name,
      description: category.blurb,
      path: `/learn/${category.slug}`,
    });
  }

  const lesson = await getLesson(slug);
  if (!lesson) return {};

  return buildMetadata({
    title: lesson.frontmatter.title,
    description: lesson.frontmatter.description,
    path: `/learn/${lesson.slug}`,
    type: "article",
    publishedAt: lesson.frontmatter.publishedAt,
    updatedAt: lesson.frontmatter.updatedAt,
  });
}

export default async function LearnSlugPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;

  if (isCategorySlug(slug)) return <CategoryIndex slug={slug} />;

  const lesson = await getLesson(slug);
  if (!lesson) notFound();

  const related = await getRelatedLessons(lesson);
  const category = getCategory(lesson.frontmatter.category);
  const { frontmatter } = lesson;

  const crumbs = [
    { href: "/", label: "Home" },
    { href: "/learn", label: "Lessons" },
    ...(category ? [{ href: `/learn/${category.slug}`, label: category.name }] : []),
    { href: `/learn/${lesson.slug}`, label: frontmatter.title },
  ];

  const meta = {
    title: frontmatter.title,
    description: frontmatter.description,
    path: `/learn/${lesson.slug}`,
    publishedAt: frontmatter.publishedAt,
    updatedAt: frontmatter.updatedAt,
  };

  return (
    <>
      <ReadingProgress />

      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <JsonLd data={breadcrumbJsonLd(crumbs)} />
        {/* HowTo takes its steps from the lesson's own headings, and the FAQ markup from the
            same frontmatter the accordion renders — so neither can describe something absent
            from the page. */}
        {frontmatter.howTo ? (
          <JsonLd
            data={howToJsonLd(
              meta,
              lesson.headings
                .filter((heading) => heading.depth === 2)
                .map((heading) => ({ text: heading.text, id: heading.id })),
            )}
          />
        ) : (
          <JsonLd data={articleJsonLd(meta)} />
        )}
        {frontmatter.faqs.length > 0 && <JsonLd data={faqJsonLd(frontmatter.faqs)} />}

        <Breadcrumbs crumbs={crumbs} />

        <header className="mt-6">
          <h1 className="max-w-3xl text-4xl leading-[1.15] font-semibold">{frontmatter.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint">
            <span>{DIFFICULTY_LABELS[frontmatter.difficulty]}</span>
            <span aria-hidden="true">·</span>
            <span>{lesson.readingMinutes} min read</span>
            <span aria-hidden="true">·</span>
            <time dateTime={frontmatter.updatedAt ?? frontmatter.publishedAt}>
              {frontmatter.updatedAt === undefined ? "Published" : "Updated"}{" "}
              {frontmatter.updatedAt ?? frontmatter.publishedAt}
            </time>
          </div>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
            {frontmatter.description}
          </p>
        </header>

        <div className="mt-12 gap-12 lg:grid lg:grid-cols-[1fr_16rem] lg:items-start">
          <div className="prose min-w-0">
            <MdxContent source={lesson.body} />
          </div>

          {/* Source order puts the lesson first; the contents list is a sidebar visually but
              secondary in the document, which is the right order for a screen reader. */}
          <aside className="order-first mb-10 lg:sticky lg:top-24 lg:order-none lg:mb-0">
            <TableOfContents headings={lesson.headings} />
          </aside>
        </div>

        <LessonFaqs faqs={frontmatter.faqs} />

        {related.length > 0 ? (
          <section aria-labelledby="next-steps" className="mt-14">
            <h2 id="next-steps" className="text-2xl font-semibold">
              Next steps
            </h2>
            <div className="mt-4">
              {related.map((next) => (
                <LessonCard key={next.slug} lesson={next} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </>
  );
}

async function CategoryIndex({ slug }: { readonly slug: string }) {
  const category = getCategory(slug);
  if (!category) notFound();

  const lessons = await getLessonsByCategory(slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/learn", label: "Lessons" },
          { href: `/learn/${category.slug}`, label: category.name },
        ]}
      />

      <h1 className="mt-6 text-4xl font-semibold">{category.name}</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">{category.blurb}</p>

      {lessons.length === 0 ? (
        <p className="mt-10 text-ink-muted">
          Nothing here yet.{" "}
          <Link href="/learn" className="text-accent underline">
            Browse all lessons
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.slug} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
