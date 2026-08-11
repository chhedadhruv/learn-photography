import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/content/ArticlePage";
import { getTip, getTips } from "@/lib/content/articles";
import { buildMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getTips()).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tips/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getTip(slug);
  if (!article) return {};

  return buildMetadata({
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    path: `/tips/${article.slug}`,
    type: "article",
    publishedAt: article.frontmatter.publishedAt,
    updatedAt: article.frontmatter.updatedAt,
  });
}

export default async function TipsArticleRoute({ params }: PageProps<"/tips/[slug]">) {
  const { slug } = await params;
  const article = await getTip(slug);
  if (!article) notFound();

  return (
    <ArticlePage
      article={article}
      path={`/tips/${article.slug}`}
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/tips", label: "Tips" },
        { href: `/tips/${article.slug}`, label: article.frontmatter.title },
      ]}
    />
  );
}
