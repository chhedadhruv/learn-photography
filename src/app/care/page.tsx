import type { Metadata } from "next";
import { ArticleListPage } from "@/components/content/ArticleListPage";
import { getCareArticles } from "@/lib/content/articles";
import { buildMetadata } from "@/lib/seo";

const CRUMBS = [
  { href: "/", label: "Home" },
  { href: "/care", label: "Camera care" },
];

export const metadata: Metadata = buildMetadata({
  title: "Camera care",
  description:
    "How to clean, store and look after a camera and its lenses without damaging anything.",
  path: "/care",
});

export default async function CareIndexPage() {
  return (
    <ArticleListPage
      crumbs={CRUMBS}
      title="Camera care"
      intro="Cleaning, storage and the small habits that keep a camera working."
      articles={await getCareArticles()}
      basePath="/care"
      emptyMessage="Nothing here yet."
    />
  );
}
