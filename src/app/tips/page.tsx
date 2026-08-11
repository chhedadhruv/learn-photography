import type { Metadata } from "next";
import { ArticleListPage } from "@/components/content/ArticleListPage";
import { getTips } from "@/lib/content/articles";
import { buildMetadata } from "@/lib/seo";

const CRUMBS = [
  { href: "/", label: "Home" },
  { href: "/tips", label: "Tips" },
];

export const metadata: Metadata = buildMetadata({
  title: "Tips",
  description: "Short, practical photography tips for beginners — one idea at a time.",
  path: "/tips",
});

export default async function TipsIndexPage() {
  return (
    <ArticleListPage
      crumbs={CRUMBS}
      title="Tips"
      intro="Short pieces: one idea at a time, nothing that needs a sitting."
      articles={await getTips()}
      basePath="/tips"
      emptyMessage="Nothing here yet."
    />
  );
}
