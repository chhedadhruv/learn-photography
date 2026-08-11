import "server-only";

import { getAllLessons } from "./loader";
import type { Lesson } from "./schema";

/**
 * The suggested order to work through.
 *
 * A curriculum is an overlay, not a requirement: most people arrive from a search engine
 * partway in, and a site that insists on a starting point is useless to them. So this exists to
 * answer "where do I begin?" for the people who ask it, and to put prev/next on the lessons it
 * covers — while every lesson still stands alone.
 *
 * Listed by slug rather than derived from categories, because the right teaching order crosses
 * category boundaries: you need a little exposure before composition is worth discussing.
 */
export const LEARNING_PATH: readonly string[] = ["template-example-two", "template-example"];

export interface PathStep {
  readonly lesson: Lesson;
  readonly position: number;
  readonly previous: Lesson | undefined;
  readonly next: Lesson | undefined;
}

/**
 * Resolves the path, skipping any slug that does not exist.
 *
 * Deliberately forgiving rather than build-breaking: the path is a curatorial opinion that will
 * be edited often, and a half-updated list should not stop a deploy. Broken *links* still fail
 * the build — this is the one place a missing slug is survivable.
 */
export async function getLearningPath(): Promise<readonly PathStep[]> {
  const lessons = await getAllLessons();

  const ordered = LEARNING_PATH.map((slug) =>
    lessons.find((lesson) => lesson.slug === slug),
  ).filter((lesson): lesson is Lesson => lesson !== undefined);

  return ordered.map((lesson, index) => ({
    lesson,
    position: index + 1,
    previous: ordered[index - 1],
    next: ordered[index + 1],
  }));
}

export async function getPathStep(slug: string): Promise<PathStep | undefined> {
  return (await getLearningPath()).find((step) => step.lesson.slug === slug);
}
