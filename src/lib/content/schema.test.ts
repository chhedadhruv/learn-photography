import { describe, expect, it } from "vitest";
import { draftLessonFrontmatterSchema, lessonFrontmatterSchema } from "./schema";

const valid = {
  title: "The exposure triangle",
  description:
    "How shutter speed, aperture and ISO work together, and why changing one means changing another.",
  category: "exposure-and-settings",
  difficulty: "beginner",
  publishedAt: "2026-08-11",
};

describe("lessonFrontmatterSchema", () => {
  it("accepts a minimal published lesson and applies defaults", () => {
    const result = lessonFrontmatterSchema.parse(valid);

    expect(result.tags).toEqual([]);
    expect(result.related).toEqual([]);
    expect(result.draft).toBe(false);
    expect(result.howTo).toBe(false);
  });

  it("rejects a description too short to serve as a search snippet", () => {
    const result = lessonFrontmatterSchema.safeParse({ ...valid, description: "Too short." });

    expect(result.success).toBe(false);
  });

  it("rejects a description that search results would truncate", () => {
    const result = lessonFrontmatterSchema.safeParse({
      ...valid,
      description: "x".repeat(161),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown category, so a typo cannot create an orphan lesson", () => {
    const result = lessonFrontmatterSchema.safeParse({ ...valid, category: "exposure" });

    expect(result.success).toBe(false);
  });

  it("rejects a non-ISO publish date", () => {
    expect(lessonFrontmatterSchema.safeParse({ ...valid, publishedAt: "11/08/2026" }).success).toBe(
      false,
    );
  });

  it("rejects a cover image without alt text", () => {
    const result = lessonFrontmatterSchema.safeParse({
      ...valid,
      cover: { src: "/assets/images/lessons/x.jpg", alt: "" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a slug that is not lowercase-hyphenated", () => {
    expect(lessonFrontmatterSchema.safeParse({ ...valid, slug: "Exposure Triangle" }).success).toBe(
      false,
    );
  });
});

describe("draftLessonFrontmatterSchema", () => {
  it("accepts a draft with only a title and category", () => {
    const result = draftLessonFrontmatterSchema.safeParse({
      title: "Half-written",
      category: "composition",
      draft: true,
    });

    expect(result.success).toBe(true);
  });

  it("still requires a known category, so a draft cannot become an orphan later", () => {
    const result = draftLessonFrontmatterSchema.safeParse({
      title: "Half-written",
      category: "nonsense",
      draft: true,
    });

    expect(result.success).toBe(false);
  });
});
