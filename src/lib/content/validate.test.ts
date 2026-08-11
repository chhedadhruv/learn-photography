import { describe, expect, it } from "vitest";
import type { Lesson, LessonFrontmatter } from "./schema";
import { assertLessonsAreConsistent, normaliseFrontmatter } from "./validate";

const frontmatter = (overrides: Partial<LessonFrontmatter> = {}): LessonFrontmatter => ({
  title: "A lesson",
  description: "A description long enough to pass the published schema's minimum length rule.",
  category: "camera-basics",
  difficulty: "beginner",
  publishedAt: "2026-08-11",
  tags: [],
  related: [],
  faqs: [],
  howTo: false,
  draft: false,
  ...overrides,
});

const lesson = (slug: string, overrides: Partial<LessonFrontmatter> = {}): Lesson => ({
  slug,
  frontmatter: frontmatter(overrides),
  body: "",
  readingMinutes: 1,
  headings: [],
  filePath: `/content/lessons/${slug}.mdx`,
});

describe("assertLessonsAreConsistent", () => {
  it("accepts a valid set", () => {
    expect(() => {
      assertLessonsAreConsistent([
        lesson("exposure-triangle", { related: ["what-is-iso"] }),
        lesson("what-is-iso"),
      ]);
    }).not.toThrow();
  });

  it("rejects two lessons claiming the same slug", () => {
    expect(() => {
      assertLessonsAreConsistent([lesson("exposure-triangle"), lesson("exposure-triangle")]);
    }).toThrow(/Two lessons claim the slug "exposure-triangle"/);
  });

  it("rejects a lesson that would shadow a category index", () => {
    // Flat URLs mean /learn/composition is already the category page.
    expect(() => {
      assertLessonsAreConsistent([lesson("composition")]);
    }).toThrow(/collides with the category index/);
  });

  it("rejects a related link to a lesson that does not exist", () => {
    expect(() => {
      assertLessonsAreConsistent([lesson("exposure-triangle", { related: ["does-not-exist"] })]);
    }).toThrow(/related lesson "does-not-exist" that does not exist/);
  });

  it("rejects a lesson listing itself as related", () => {
    expect(() => {
      assertLessonsAreConsistent([lesson("exposure-triangle", { related: ["exposure-triangle"] })]);
    }).toThrow(/lists itself as a related lesson/);
  });

  it("allows a published lesson to reference a draft", () => {
    // Drafts are filtered out after this check. Validating the published set alone would pass in
    // development and then break the production build, where the draft no longer exists.
    expect(() => {
      assertLessonsAreConsistent([
        lesson("exposure-triangle", { related: ["unfinished"] }),
        lesson("unfinished", { draft: true }),
      ]);
    }).not.toThrow();
  });

  it("names both files so the offending pair is obvious", () => {
    expect(() => {
      assertLessonsAreConsistent([lesson("dupe"), lesson("dupe")]);
    }).toThrow(/dupe\.mdx/);
  });
});

describe("normaliseFrontmatter", () => {
  it("fills a draft's missing fields with honest empties rather than asserting they exist", () => {
    const result = normaliseFrontmatter({
      title: "Half-written",
      category: "composition",
      draft: true,
    });

    expect(result.description).toBe("");
    expect(result.publishedAt).toBe("");
    expect(result.difficulty).toBe("beginner");
    expect(result.related).toEqual([]);
    expect(result.draft).toBe(true);
  });

  it("omits optional keys entirely instead of setting them undefined", () => {
    const result = normaliseFrontmatter({
      title: "Half-written",
      category: "composition",
      draft: true,
    });

    expect("updatedAt" in result).toBe(false);
    expect("cover" in result).toBe(false);
  });

  it("preserves a published lesson's values", () => {
    const source = frontmatter({ updatedAt: "2026-09-01", tags: ["aperture"] });

    expect(normaliseFrontmatter(source)).toEqual(source);
  });
});
