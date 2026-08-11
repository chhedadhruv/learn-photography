import "server-only";

import { defineCollection, type Entry } from "./collections";
import { glossaryFrontmatterSchema, type GlossaryFrontmatter } from "./schema";

export type GlossaryEntry = Entry<GlossaryFrontmatter>;

const collection = defineCollection("glossary", glossaryFrontmatterSchema);

export const getAllTerms = async (): Promise<readonly GlossaryEntry[]> =>
  [...(await collection.all())].sort((a, b) =>
    a.frontmatter.term.localeCompare(b.frontmatter.term),
  );

export const getTerm = async (slug: string) => collection.get(slug);

/**
 * Every name a term answers to, mapped to its slug.
 *
 * Aliases matter more than they look: someone who has only ever heard "f-stop" will not search
 * for "aperture", and a glossary that cannot be found under the word you know is not a glossary.
 */
export async function getTermIndex(): Promise<ReadonlyMap<string, GlossaryEntry>> {
  const index = new Map<string, GlossaryEntry>();

  for (const entry of await getAllTerms()) {
    index.set(entry.slug, entry);
    for (const alias of entry.frontmatter.aliases) {
      index.set(alias.toLowerCase().replace(/\s+/g, "-"), entry);
    }
  }

  return index;
}
