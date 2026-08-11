import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { estimateReadingMinutes, extractHeadings } from "./markdown";
import type { Heading } from "./schema";

/**
 * A generic MDX collection.
 *
 * Lessons, care articles, tips, glossary terms and FAQ entries all want the same thing: read a
 * directory, validate frontmatter, fail the build with the offending filename if it is wrong.
 * The lesson loader keeps its own file because it carries rules the others do not — drafts,
 * category collisions, related links — but everything else shares this.
 */

export interface Entry<T> {
  readonly slug: string;
  readonly frontmatter: T;
  readonly body: string;
  readonly readingMinutes: number;
  readonly headings: readonly Heading[];
  readonly filePath: string;
}

function fail(filePath: string, error: z.ZodError): never {
  const relative = path.relative(process.cwd(), filePath);
  throw new Error(`Invalid frontmatter in ${relative}\n\n${z.prettifyError(error)}`);
}

async function read<T>(directory: string, schema: z.ZodType<T>): Promise<readonly Entry<T>[]> {
  const dir = path.join(process.cwd(), "content", directory);

  let filenames: string[];
  try {
    filenames = await readdir(dir);
  } catch {
    // A collection with no directory yet is empty, not broken.
    return [];
  }

  const entries = await Promise.all(
    filenames
      .filter((name) => name.endsWith(".mdx"))
      .map(async (name) => {
        const filePath = path.join(dir, name);
        const { data, content } = matter(await readFile(filePath, "utf8"));

        const parsed = schema.safeParse(data);
        if (!parsed.success) fail(filePath, parsed.error);

        return {
          slug: path.basename(name, ".mdx"),
          frontmatter: parsed.data,
          body: content,
          readingMinutes: estimateReadingMinutes(content),
          headings: extractHeadings(content),
          filePath,
        };
      }),
  );

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.slug)) {
      throw new Error(`Two files in content/${directory} share the slug "${entry.slug}".`);
    }
    seen.add(entry.slug);
  }

  return entries;
}

/**
 * Reads and validates once per process. A build touches a collection from many routes, and
 * re-reading it each time would multiply the work for no benefit.
 */
export function defineCollection<T>(directory: string, schema: z.ZodType<T>) {
  let cached: Promise<readonly Entry<T>[]> | null = null;

  const all = () => {
    cached ??= read(directory, schema);
    return cached;
  };

  return {
    all,
    async get(slug: string): Promise<Entry<T> | undefined> {
      return (await all()).find((entry) => entry.slug === slug);
    },
    async slugs(): Promise<readonly string[]> {
      return (await all()).map((entry) => entry.slug);
    },
  };
}
