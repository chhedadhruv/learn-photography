import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllTerms, getTerm } from "@/lib/content/glossary";
import { getLesson } from "@/lib/content/loader";
import { MdxContent } from "@/lib/content/mdx";
import { breadcrumbJsonLd, definedTermJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getAllTerms()).map((entry) => ({ term: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/glossary/[term]">): Promise<Metadata> {
  const { term } = await params;
  const entry = await getTerm(term);
  if (!entry) return {};

  return buildMetadata({
    title: entry.frontmatter.term,
    description: entry.frontmatter.summary,
    path: `/glossary/${entry.slug}`,
  });
}

export default async function GlossaryTermPage({ params }: PageProps<"/glossary/[term]">) {
  const { term } = await params;
  const entry = await getTerm(term);
  if (!entry) notFound();

  const crumbs = [
    { href: "/", label: "Home" },
    { href: "/glossary", label: "Glossary" },
    { href: `/glossary/${entry.slug}`, label: entry.frontmatter.term },
  ];

  const lessons = (
    await Promise.all(entry.frontmatter.lessons.map(async (slug) => getLesson(slug)))
  ).filter((lesson) => lesson !== undefined);

  const related = (
    await Promise.all(entry.frontmatter.related.map(async (slug) => getTerm(slug)))
  ).filter((other) => other !== undefined);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={definedTermJsonLd({
          term: entry.frontmatter.term,
          summary: entry.frontmatter.summary,
          path: `/glossary/${entry.slug}`,
        })}
      />
      <Breadcrumbs crumbs={crumbs} />

      <h1 className="mt-6 text-4xl font-semibold">{entry.frontmatter.term}</h1>

      {entry.frontmatter.aliases.length > 0 && (
        <p className="mt-2 text-sm text-ink-faint">
          Also called {entry.frontmatter.aliases.join(", ")}
        </p>
      )}

      <div className="prose mt-8">
        <MdxContent source={entry.body} />
      </div>

      {lessons.length > 0 && (
        <section aria-labelledby="term-lessons" className="mt-10">
          <h2 id="term-lessons" className="text-xl font-semibold">
            Where this is explained properly
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {lessons.map((lesson) => (
              <li key={lesson.slug}>
                <Link href={`/learn/${lesson.slug}`} className="text-accent underline">
                  {lesson.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="term-related" className="mt-10">
          <h2 id="term-related" className="text-xl font-semibold">
            Related terms
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/glossary/${other.slug}`}
                  className="rounded-full border border-rule px-3 py-1 text-sm hover:border-rule-strong"
                >
                  {other.frontmatter.term}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
