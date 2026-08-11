import GithubSlugger from "github-slugger";
import type { Heading } from "./schema";

/**
 * Pure text analysis over raw MDX source. No filesystem, no React, no MDX compilation — so the
 * table of contents and reading time are unit-testable and identical between build and test.
 *
 * Anchors are generated with github-slugger, the same library rehype-slug uses when rendering,
 * so a table-of-contents link can never point at an id that does not exist on the page.
 */

const FENCE = /^\s*(?:```|~~~)/;
const ATX_HEADING = /^(#{2,3})\s+(.+?)\s*#*\s*$/;

/** Strips inline markdown so a heading reads as plain text in the contents list. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .trim();
}

/**
 * Collects h2 and h3 headings. h1 is excluded — the lesson title is rendered from frontmatter,
 * so a heading list that included it would duplicate the page title.
 */
export function extractHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let insideFence = false;

  for (const line of body.split("\n")) {
    if (FENCE.test(line)) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence) continue;

    const match = ATX_HEADING.exec(line);
    if (!match) continue;

    const hashes = match[1];
    const rawText = match[2];
    if (hashes === undefined || rawText === undefined) continue;

    const text = toPlainText(rawText);
    if (text.length === 0) continue;

    headings.push({
      depth: hashes.length === 2 ? 2 : 3,
      id: slugger.slug(text),
      text,
    });
  }

  return headings;
}

const WORDS_PER_MINUTE = 200;

/**
 * Estimates reading time, always rounded up and never below a minute.
 *
 * Code blocks and JSX component tags are removed first: they are scanned rather than read, and
 * counting `<Callout type="tip">` as three words inflates the estimate on component-heavy pages.
 */
export function estimateReadingMinutes(body: string): number {
  const prose = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`|-]/g, " ");

  const words = prose.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word));

  return Math.max(1, Math.ceil(words.length / WORDS_PER_MINUTE));
}
