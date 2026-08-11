import { describe, expect, it } from "vitest";
import { estimateReadingMinutes, extractHeadings } from "./markdown";

describe("extractHeadings", () => {
  it("collects h2 and h3 with anchors matching rehype-slug", () => {
    const headings = extractHeadings(
      ["## What is aperture?", "", "text", "", "### The f-number"].join("\n"),
    );

    expect(headings).toEqual([
      { depth: 2, id: "what-is-aperture", text: "What is aperture?" },
      { depth: 3, id: "the-f-number", text: "The f-number" },
    ]);
  });

  it("skips h1, because the page title already renders from frontmatter", () => {
    expect(extractHeadings("# Lesson title\n\n## A section")).toEqual([
      { depth: 2, id: "a-section", text: "A section" },
    ]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const body = ["## Real heading", "", "```md", "## Not a heading", "```", "", "## Another"].join(
      "\n",
    );

    expect(extractHeadings(body).map((heading) => heading.text)).toEqual([
      "Real heading",
      "Another",
    ]);
  });

  it("strips inline markdown so the contents list reads as plain text", () => {
    expect(extractHeadings("## Using `f/2.8` **wide open**")[0]?.text).toBe(
      "Using f/2.8 wide open",
    );
  });

  it("de-duplicates anchors when two headings share a title", () => {
    const headings = extractHeadings("## Setup\n\n## Setup");

    expect(headings.map((heading) => heading.id)).toEqual(["setup", "setup-1"]);
  });
});

describe("estimateReadingMinutes", () => {
  it("never reports less than a minute", () => {
    expect(estimateReadingMinutes("Three words here")).toBe(1);
  });

  it("rounds up, so a part-read minute still counts", () => {
    // 250 words at 200wpm is 1.25 minutes.
    expect(estimateReadingMinutes(Array.from({ length: 250 }, () => "word").join(" "))).toBe(2);
  });

  it("excludes code blocks, which are scanned rather than read", () => {
    const prose = Array.from({ length: 200 }, () => "word").join(" ");
    const code = ["```", Array.from({ length: 2000 }, () => "token").join(" "), "```"].join("\n");

    expect(estimateReadingMinutes(`${prose}\n\n${code}`)).toBe(1);
  });

  it("does not count JSX component tags as prose", () => {
    const withComponents = Array.from(
      { length: 100 },
      () => '<Callout type="tip">word</Callout>',
    ).join(" ");

    // 100 real words, not 400 including the tag innards.
    expect(estimateReadingMinutes(withComponents)).toBe(1);
  });
});
