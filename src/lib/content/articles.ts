import "server-only";

import { defineCollection, type Entry } from "./collections";
import { articleFrontmatterSchema, type ArticleFrontmatter } from "./schema";

export type Article = Entry<ArticleFrontmatter>;

/** Drafts render at localhost and vanish from production, exactly as lessons do. */
const includeDrafts = process.env.NODE_ENV !== "production";

function visible(entries: readonly Article[]): readonly Article[] {
  const shown = includeDrafts ? entries : entries.filter((e) => !e.frontmatter.draft);
  return [...shown].sort((a, b) =>
    b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt),
  );
}

const care = defineCollection("care", articleFrontmatterSchema);
const tips = defineCollection("tips", articleFrontmatterSchema);

export const getCareArticles = async () => visible(await care.all());
export const getCareArticle = async (slug: string) => care.get(slug);

export const getTips = async () => visible(await tips.all());
export const getTip = async (slug: string) => tips.get(slug);
