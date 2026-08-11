import Link from "next/link";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Article } from "@/lib/content/articles";
import { breadcrumbJsonLd } from "@/lib/jsonld";

/** Care and tips differ in tone and length, not in structure, so they share this listing. */
export function ArticleListPage({
  crumbs,
  title,
  intro,
  articles,
  basePath,
  emptyMessage,
}: {
  readonly crumbs: readonly Crumb[];
  readonly title: string;
  readonly intro: string;
  readonly articles: readonly Article[];
  readonly basePath: string;
  readonly emptyMessage: string;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />

      <h1 className="mt-6 text-4xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">{intro}</p>

      {articles.length === 0 ? (
        <p className="mt-10 text-ink-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-10">
          {articles.map((article) => (
            <article key={article.slug} className="border-b border-rule py-6">
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-ink-faint">
                <span>{article.readingMinutes} min read</span>
                {article.frontmatter.draft && (
                  <span className="rounded border border-rule-strong px-1.5 py-0.5">Draft</span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-semibold">
                <Link href={`${basePath}/${article.slug}`} className="hover:text-accent">
                  {article.frontmatter.title}
                </Link>
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {article.frontmatter.description}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
