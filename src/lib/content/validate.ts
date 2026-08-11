import { isCategorySlug } from "./categories";
import type { DraftLessonFrontmatter, Lesson, LessonFrontmatter } from "./schema";

/**
 * Cross-file rules and frontmatter normalisation. Kept free of `node:fs` and `server-only` so
 * the invariants that protect readers can be tested directly, rather than only through a build.
 */

const basename = (filePath: string) => filePath.split("/").pop() ?? filePath;

/**
 * Widens a draft's partial frontmatter into the full shape the UI reads.
 *
 * Done explicitly rather than with a cast: a draft genuinely may not have a description or a
 * publish date, and asserting otherwise would push an `undefined` into code that believes it has
 * a string. Empty values here are honest — pages treat an empty `publishedAt` as unpublished.
 */
export function normaliseFrontmatter(
  data: LessonFrontmatter | DraftLessonFrontmatter,
): LessonFrontmatter {
  return {
    title: data.title,
    description: data.description ?? "",
    category: data.category,
    difficulty: data.difficulty ?? "beginner",
    publishedAt: data.publishedAt ?? "",
    tags: data.tags ?? [],
    related: data.related ?? [],
    faqs: data.faqs ?? [],
    howTo: data.howTo ?? false,
    // Required in both schemas — `false` by default when published, literal `true` when a draft.
    draft: data.draft,
    // Spread conditionally: `exactOptionalPropertyTypes` rejects an explicit `undefined` for an
    // optional property, so these are either present with a value or absent entirely.
    ...(data.updatedAt === undefined ? {} : { updatedAt: data.updatedAt }),
    ...(data.cover === undefined ? {} : { cover: data.cover }),
    ...(data.slug === undefined ? {} : { slug: data.slug }),
  };
}

/**
 * Every rule here catches a mistake that would otherwise reach a reader as a 404 or a dead link
 * rather than a failed build.
 *
 * Run against every file including drafts, before drafts are filtered out. Checking only the
 * published set would let a `related` reference to a draft pass in development and then break
 * the production build, where that draft no longer exists.
 */
export function assertLessonsAreConsistent(lessons: readonly Lesson[]): void {
  const byslug = new Map<string, string>();

  for (const lesson of lessons) {
    const previous = byslug.get(lesson.slug);
    if (previous !== undefined) {
      throw new Error(
        `Two lessons claim the slug "${lesson.slug}": ${basename(previous)} and ` +
          `${basename(lesson.filePath)}. Slugs must be unique across /learn.`,
      );
    }
    byslug.set(lesson.slug, lesson.filePath);

    // Lessons and category indexes share the /learn/* namespace under flat URLs, so a lesson
    // named after a category would shadow that category's page.
    if (isCategorySlug(lesson.slug)) {
      throw new Error(
        `Lesson "${lesson.slug}" collides with the category index at /learn/${lesson.slug}. ` +
          `Rename the file, or set a different slug in its frontmatter.`,
      );
    }
  }

  for (const lesson of lessons) {
    for (const related of lesson.frontmatter.related) {
      if (related === lesson.slug) {
        throw new Error(`${basename(lesson.filePath)} lists itself as a related lesson.`);
      }
      if (!byslug.has(related)) {
        throw new Error(
          `${basename(lesson.filePath)} lists a related lesson "${related}" that does not ` +
            `exist. Check the slug, or remove it.`,
        );
      }
    }
  }
}
