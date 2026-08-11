import "server-only";

import { defineCollection, type Entry } from "./collections";
import { faqFrontmatterSchema, type FaqFrontmatter } from "./schema";

export type FaqEntry = Entry<FaqFrontmatter>;

const collection = defineCollection("faq", faqFrontmatterSchema);

export interface FaqTopic {
  readonly topic: string;
  readonly entries: readonly FaqEntry[];
}

/** Grouped by topic, ordered within each, topics in the order they first appear. */
export async function getFaqByTopic(): Promise<readonly FaqTopic[]> {
  const entries = [...(await collection.all())].sort(
    (a, b) =>
      a.frontmatter.order - b.frontmatter.order ||
      a.frontmatter.question.localeCompare(b.frontmatter.question),
  );

  const topics: FaqTopic[] = [];
  for (const entry of entries) {
    const existing = topics.find((t) => t.topic === entry.frontmatter.topic);
    if (existing) {
      (existing.entries as FaqEntry[]).push(entry);
    } else {
      topics.push({ topic: entry.frontmatter.topic, entries: [entry] });
    }
  }

  return topics;
}

export const getAllFaqs = async () => collection.all();
