import { ImageResponse } from "next/og";
import { OgCard } from "@/app/opengraph-image";
import { getAllTerms, getTerm } from "@/lib/content/glossary";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.name;

export async function generateStaticParams() {
  return (await getAllTerms()).map((entry) => ({ term: entry.slug }));
}

export default async function GlossaryOgImage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const entry = await getTerm(term);

  return new ImageResponse(
    <OgCard
      eyebrow="Glossary"
      title={entry?.frontmatter.term ?? SITE.name}
      subtitle={entry?.frontmatter.summary}
    />,
    size,
  );
}
