import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { ReadingProgress } from "@/components/lesson/ReadingProgress";
import { TableOfContents } from "@/components/lesson/TableOfContents";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Article } from "@/lib/content/articles";
import { MdxContent } from "@/lib/content/mdx";
import { articleJsonLd, breadcrumbJsonLd, howToJsonLd } from "@/lib/jsonld";

export function ArticlePage({
  article,
  crumbs,
  path,
}: {
  readonly article: Article;
  readonly crumbs: readonly Crumb[];
  readonly path: string;
}) {
  const { frontmatter } = article;

  const meta = {
    title: frontmatter.title,
    description: frontmatter.description,
    path,
    publishedAt: frontmatter.publishedAt,
    updatedAt: frontmatter.updatedAt,
  };

  return (
    <>
      <ReadingProgress />

      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <JsonLd data={breadcrumbJsonLd(crumbs)} />
        {/* Steps come from the article's own headings, so the markup cannot describe steps the
            page does not have. */}
        {frontmatter.howTo ? (
          <JsonLd
            data={howToJsonLd(
              meta,
              article.headings
                .filter((heading) => heading.depth === 2)
                .map((heading) => ({ text: heading.text, id: heading.id })),
            )}
          />
        ) : (
          <JsonLd data={articleJsonLd(meta)} />
        )}

        <Breadcrumbs crumbs={crumbs} />

        <header className="mt-6">
          <h1 className="max-w-3xl text-4xl leading-[1.15] font-semibold">{frontmatter.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 text-sm text-ink-faint">
            <span>{article.readingMinutes} min read</span>
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
            <MdxContent source={article.body} />
          </div>
          <aside className="order-first mb-10 lg:sticky lg:top-24 lg:order-none lg:mb-0">
            <TableOfContents headings={article.headings} />
          </aside>
        </div>
      </article>
    </>
  );
}
