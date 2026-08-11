import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/content/ArticlePage";
import { getCareArticle, getCareArticles } from "@/lib/content/articles";
import { buildMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCareArticles()).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/care/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getCareArticle(slug);
  if (!article) return {};

  return buildMetadata({
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    path: `/care/${article.slug}`,
    type: "article",
    publishedAt: article.frontmatter.publishedAt,
    updatedAt: article.frontmatter.updatedAt,
  });
}

export default async function CareArticleRoute({ params }: PageProps<"/care/[slug]">) {
  const { slug } = await params;
  const article = await getCareArticle(slug);
  if (!article) notFound();

  return (
    <ArticlePage
      article={article}
      path={`/care/${article.slug}`}
      crumbs={[
        { href: "/", label: "Home" },
        { href: "/care", label: "Camera care" },
        { href: `/care/${article.slug}`, label: article.frontmatter.title },
      ]}
    />
  );
}
