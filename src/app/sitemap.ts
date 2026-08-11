import type { MetadataRoute } from "next";
import { CHALLENGES } from "@/lib/challenges/registry";
import { DIAGNOSE_EXERCISES } from "@content/challenges/diagnose";
import { MATCH_EXERCISES } from "@content/challenges/match";
import { METERING_EXERCISES } from "@content/challenges/metering";
import { CATEGORIES } from "@/lib/content/categories";
import { getCareArticles, getTips } from "@/lib/content/articles";
import { getAllTerms } from "@/lib/content/glossary";
import { getAllLessons } from "@/lib/content/loader";
import { SITE } from "@/lib/site";

/**
 * Every page worth indexing, built from the content itself so it cannot fall behind.
 *
 * Drafts are already filtered out by the loaders, so an unfinished lesson never appears here —
 * which matters more than it sounds, because a sitemap entry is an explicit invitation to crawl.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lessons, terms, care, tips] = await Promise.all([
    getAllLessons(),
    getAllTerms(),
    getCareArticles(),
    getTips(),
  ]);

  const url = (path: string) => `${SITE.url}${path}`;

  const statics: MetadataRoute.Sitemap = [
    { url: url("/"), priority: 1 },
    { url: url("/learn"), priority: 0.9 },
    { url: url("/practice"), priority: 0.9 },
    { url: url("/start-here"), priority: 0.9 },
    { url: url("/faq"), priority: 0.7 },
    { url: url("/glossary"), priority: 0.6 },
    { url: url("/care"), priority: 0.7 },
    { url: url("/tips"), priority: 0.6 },
    { url: url("/practice/sandbox"), priority: 0.6 },
    { url: url("/about"), priority: 0.3 },
  ];

  return [
    ...statics,
    ...CATEGORIES.map((category) => ({ url: url(`/learn/${category.slug}`), priority: 0.7 })),
    ...lessons.map((lesson) => ({
      url: url(`/learn/${lesson.slug}`),
      lastModified: lesson.frontmatter.updatedAt ?? lesson.frontmatter.publishedAt,
      priority: 0.8,
    })),
    ...care.map((article) => ({
      url: url(`/care/${article.slug}`),
      lastModified: article.frontmatter.updatedAt ?? article.frontmatter.publishedAt,
      priority: 0.6,
    })),
    ...tips.map((article) => ({
      url: url(`/tips/${article.slug}`),
      lastModified: article.frontmatter.updatedAt ?? article.frontmatter.publishedAt,
      priority: 0.5,
    })),
    ...terms.map((term) => ({ url: url(`/glossary/${term.slug}`), priority: 0.4 })),
    ...CHALLENGES.map((challenge) => ({ url: url(`/practice/${challenge.id}`), priority: 0.6 })),
    ...MATCH_EXERCISES.map((e) => ({ url: url(`/practice/match/${e.id}`), priority: 0.5 })),
    ...DIAGNOSE_EXERCISES.map((e) => ({ url: url(`/practice/diagnose/${e.id}`), priority: 0.5 })),
    ...METERING_EXERCISES.map((e) => ({ url: url(`/practice/metering/${e.id}`), priority: 0.5 })),
  ];
}
