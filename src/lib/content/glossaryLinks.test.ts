import { describe, expect, it } from "vitest";
import { assertGlossaryReferencesResolve, glossaryReferencesIn } from "./validate";

describe("glossaryReferencesIn", () => {
  it("finds a single reference", () => {
    expect(glossaryReferencesIn('See <GlossaryLink term="aperture" />.')).toEqual(["aperture"]);
  });

  it("finds several across a body", () => {
    const body = `
      Light enters through the <GlossaryLink term="aperture" />, and how much of the scene is
      sharp is its <GlossaryLink term="depth-of-field">depth of field</GlossaryLink>.
    `;

    expect(glossaryReferencesIn(body)).toEqual(["aperture", "depth-of-field"]);
  });

  it("finds none in a body that has none", () => {
    expect(glossaryReferencesIn("Just prose.")).toEqual([]);
  });
});

describe("assertGlossaryReferencesResolve", () => {
  const known = new Set(["aperture", "depth-of-field"]);

  it("accepts references that exist", () => {
    expect(() => {
      assertGlossaryReferencesResolve(
        [{ filePath: "/content/lessons/a.mdx", body: '<GlossaryLink term="aperture" />' }],
        known,
      );
    }).not.toThrow();
  });

  it("rejects a term that does not exist, naming the file and the fix", () => {
    expect(() => {
      assertGlossaryReferencesResolve(
        [{ filePath: "/content/lessons/a.mdx", body: '<GlossaryLink term="bokeh" />' }],
        known,
      );
    }).toThrow(/a\.mdx.*"bokeh".*content\/glossary\/bokeh\.mdx/s);
  });

  it("checks every document, not just the first", () => {
    expect(() => {
      assertGlossaryReferencesResolve(
        [
          { filePath: "/content/lessons/a.mdx", body: '<GlossaryLink term="aperture" />' },
          { filePath: "/content/lessons/b.mdx", body: '<GlossaryLink term="nonsense" />' },
        ],
        known,
      );
    }).toThrow(/b\.mdx/);
  });
});
