import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { estimateReadingMinutes, extractHeadings } from "./markdown";
import {
  draftFlagSchema,
  draftLessonFrontmatterSchema,
  lessonFrontmatterSchema,
  type Lesson,
} from "./schema";
import { assertLessonsAreConsistent, normaliseFrontmatter } from "./validate";

const LESSONS_DIR = path.join(process.cwd(), "content", "lessons");

/**
 * Drafts are for writing, not publishing. They render at localhost so a lesson can be reviewed
 * in place, and are dropped from production builds entirely — no page, no index entry, no
 * sitemap row.
 */
const includeDrafts = process.env.NODE_ENV !== "production";

/** Reports which file broke, and how, instead of a bare stack trace from deep inside zod. */
function fail(filePath: string, error: z.ZodError): never {
  const relative = path.relative(process.cwd(), filePath);
  throw new Error(`Invalid frontmatter in ${relative}\n\n${z.prettifyError(error)}`);
}

function parseLesson(filePath: string, source: string): Lesson {
  const { data, content } = matter(source);

  const draftFlag = draftFlagSchema.safeParse(data);
  const isDraft = draftFlag.success && draftFlag.data.draft;

  const schema = isDraft ? draftLessonFrontmatterSchema : lessonFrontmatterSchema;
  const parsed = schema.safeParse(data);
  if (!parsed.success) fail(filePath, parsed.error);

  const fileSlug = path.basename(filePath, ".mdx");
  const frontmatter = normaliseFrontmatter(parsed.data);

  return {
    // Slug comes from the filename so two lessons cannot collide silently. Frontmatter may
    // override it, which lets a file be renamed without changing a published URL.
    slug: frontmatter.slug ?? fileSlug,
    frontmatter,
    body: content,
    readingMinutes: estimateReadingMinutes(content),
    headings: extractHeadings(content),
    filePath,
  };
}

async function readLessons(): Promise<readonly Lesson[]> {
  let filenames: string[];
  try {
    filenames = await readdir(LESSONS_DIR);
  } catch {
    return [];
  }

  const mdxFiles = filenames.filter((name) => name.endsWith(".mdx"));

  const parsed = await Promise.all(
    mdxFiles.map(async (name) => {
      const filePath = path.join(LESSONS_DIR, name);
      return parseLesson(filePath, await readFile(filePath, "utf8"));
    }),
  );

  // Consistency is checked across every file, drafts included, before any are filtered out.
  // Checking only the published set would let a `related` reference to a draft pass in
  // development and then break the production build, where that draft no longer exists.
  assertLessonsAreConsistent(parsed);

  const visible = includeDrafts ? parsed : parsed.filter((lesson) => !lesson.frontmatter.draft);

  // Newest first. Drafts carry an empty date and sort to the end, which is where they belong.
  return [...visible].sort((a, b) =>
    b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt),
  );
}

// Read and validate once per process. A build touches the content set from many routes, and
// re-reading it per route would multiply the work for no benefit.
let cached: Promise<readonly Lesson[]> | null = null;

export function getAllLessons(): Promise<readonly Lesson[]> {
  cached ??= readLessons();
  return cached;
}

export async function getLesson(slug: string): Promise<Lesson | undefined> {
  const lessons = await getAllLessons();
  return lessons.find((lesson) => lesson.slug === slug);
}

export async function getLessonsByCategory(category: string): Promise<readonly Lesson[]> {
  const lessons = await getAllLessons();
  return lessons.filter((lesson) => lesson.frontmatter.category === category);
}

export async function getRelatedLessons(lesson: Lesson): Promise<readonly Lesson[]> {
  const lessons = await getAllLessons();
  return lesson.frontmatter.related
    .map((slug) => lessons.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is Lesson => candidate !== undefined);
}
