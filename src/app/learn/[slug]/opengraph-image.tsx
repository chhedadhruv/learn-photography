import { ImageResponse } from "next/og";
import { OgCard } from "@/app/opengraph-image";
import {
  CATEGORIES,
  DIFFICULTY_LABELS,
  getCategory,
  isCategorySlug,
} from "@/lib/content/categories";
import { getAllLessons, getLesson } from "@/lib/content/loader";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.name;

export async function generateStaticParams() {
  const lessons = await getAllLessons();
  return [
    ...CATEGORIES.map((category) => ({ slug: category.slug })),
    ...lessons.map((lesson) => ({ slug: lesson.slug })),
  ];
}

/** A card that says which lesson it is, so a shared link is worth clicking. */
export default async function LessonOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (isCategorySlug(slug)) {
    const category = getCategory(slug);
    return new ImageResponse(
      <OgCard eyebrow="Lessons" title={category?.name ?? "Lessons"} subtitle={category?.blurb} />,
      size,
    );
  }

  const lesson = await getLesson(slug);
  if (!lesson) {
    return new ImageResponse(<OgCard title={SITE.name} />, size);
  }

  const category = getCategory(lesson.frontmatter.category);
  const eyebrow = [category?.name, DIFFICULTY_LABELS[lesson.frontmatter.difficulty]]
    .filter((part) => part !== undefined)
    .join(" · ");

  return new ImageResponse(<OgCard eyebrow={eyebrow} title={lesson.frontmatter.title} />, size);
}
