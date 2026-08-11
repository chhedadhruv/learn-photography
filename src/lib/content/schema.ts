import { z } from "zod";
import { CATEGORY_SLUGS, DIFFICULTIES } from "./categories";

/**
 * Frontmatter contracts.
 *
 * These run at build time and a failure stops the build. That is deliberate: a lesson missing
 * its meta description would otherwise ship and quietly rank badly, which is far more expensive
 * to discover than a red build.
 *
 * Drafts are validated against a relaxed schema so half-written work does not block a build,
 * and they never reach production.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase words separated by single hyphens");

const isoDate = z.string().regex(ISO_DATE, "must be an ISO date, e.g. 2026-08-11");

const image = z.object({
  src: z.string().min(1),
  // Required rather than optional: an image without alt text is inaccessible, and Google reads
  // it too. There is no valid reason for a content image to omit it.
  alt: z.string().min(1, "every image needs alt text describing what it shows"),
});

const faq = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/** Fields every published lesson must carry. */
export const lessonFrontmatterSchema = z.object({
  title: z.string().min(1).max(90),
  description: z
    .string()
    .min(50, "too short to work as a search result snippet")
    .max(160, "search results truncate beyond 160 characters"),
  category: z.enum(CATEGORY_SLUGS),
  difficulty: z.enum(DIFFICULTIES),
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  tags: z.array(z.string().min(1)).default([]),
  slug: slug.optional(),
  cover: image.optional(),
  related: z.array(slug).default([]),
  faqs: z.array(faq).default([]),
  /** Opts the lesson into HowTo structured data. Phase 9 reads it. */
  howTo: z.boolean().default(false),
  draft: z.boolean().default(false),
});

/**
 * Draft lessons need only enough to render. Everything else is optional so an unfinished file
 * never fails a build, while a published one is held to the full contract above.
 */
export const draftLessonFrontmatterSchema = lessonFrontmatterSchema.partial().extend({
  title: z.string().min(1),
  category: z.enum(CATEGORY_SLUGS),
  draft: z.literal(true),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
export type DraftLessonFrontmatter = z.infer<typeof draftLessonFrontmatterSchema>;

/** Discriminates before validating, so a draft is never judged by the published schema. */
export const draftFlagSchema = z.object({ draft: z.boolean().default(false) });

export interface Lesson {
  readonly slug: string;
  readonly frontmatter: LessonFrontmatter;
  readonly body: string;
  readonly readingMinutes: number;
  readonly headings: readonly Heading[];
  readonly filePath: string;
}

export interface Heading {
  readonly depth: 2 | 3;
  readonly id: string;
  readonly text: string;
}
