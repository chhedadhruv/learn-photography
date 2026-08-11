import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/**
 * Builds the static search index.
 *
 * Runs before the build rather than at request time: the content only changes on a deploy, so
 * searching it is a lookup in a file the browser can cache, not a server round trip.
 *
 * Reads the MDX directly rather than importing the content layer, because that layer is marked
 * `server-only` and this is a standalone script. Validation still happens during the build, so a
 * malformed file fails there — this only has to be tolerant enough to reach that point.
 */
interface SearchRecord {
  readonly id: string;
  readonly kind: "lesson" | "glossary" | "faq" | "care" | "tip" | "challenge";
  readonly title: string;
  readonly summary: string;
  readonly url: string;
  /** Extra words that should match, such as glossary aliases and tags. */
  readonly keywords: string;
  readonly body: string;
}

const ROOT = process.cwd();

/** Search matches words, and markdown punctuation is not words. */
function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>`|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

async function readCollection(directory: string) {
  const dir = path.join(ROOT, "content", directory);
  try {
    const names = await readdir(dir);
    return await Promise.all(
      names
        .filter((name) => name.endsWith(".mdx"))
        .map(async (name) => {
          const raw = await readFile(path.join(dir, name), "utf8");
          const { data, content } = matter(raw);
          return { slug: path.basename(name, ".mdx"), data, content };
        }),
    );
  } catch {
    return [];
  }
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/**
 * Checks every `<GlossaryLink term="…" />` against the glossary.
 *
 * Done here because this script already reads every collection and runs before every build, so a
 * mistyped term fails the build with a filename rather than shipping a link that 404s. The
 * glossary is the safety net for jargon; a broken one is worse than none.
 */
async function assertGlossaryLinksResolve(): Promise<void> {
  const glossary = await readCollection("glossary");
  const known = new Set(glossary.map((entry) => entry.slug));

  const documents = [
    ...(await readCollection("lessons")),
    ...(await readCollection("care")),
    ...(await readCollection("tips")),
    ...(await readCollection("faq")),
    ...glossary,
  ];

  for (const document of documents) {
    for (const match of document.content.matchAll(/<GlossaryLink\s+term="([^"]+)"/g)) {
      const term = match[1];
      if (term !== undefined && !known.has(term)) {
        throw new Error(
          `${document.slug}.mdx links to a glossary term "${term}" that does not exist. ` +
            `Add content/glossary/${term}.mdx, or correct the reference.`,
        );
      }
    }
  }
}

async function build(): Promise<void> {
  await assertGlossaryLinksResolve();

  const records: SearchRecord[] = [];

  for (const { slug, data, content } of await readCollection("lessons")) {
    if (data.draft === true) continue;
    records.push({
      id: `lesson:${slug}`,
      kind: "lesson",
      title: asString(data.title),
      summary: asString(data.description),
      url: `/learn/${slug}`,
      keywords: [...asArray(data.tags), asString(data.category)].join(" "),
      body: plainText(content),
    });
  }

  for (const { slug, data, content } of await readCollection("glossary")) {
    records.push({
      id: `glossary:${slug}`,
      kind: "glossary",
      title: asString(data.term),
      summary: asString(data.summary),
      url: `/glossary/${slug}`,
      // Aliases are the point: someone who only knows "f-stop" will never search "aperture".
      keywords: asArray(data.aliases).join(" "),
      body: plainText(content),
    });
  }

  for (const { slug, data, content } of await readCollection("faq")) {
    records.push({
      id: `faq:${slug}`,
      kind: "faq",
      title: asString(data.question),
      summary: plainText(content).slice(0, 160),
      url: `/faq#${slug}`,
      keywords: asString(data.topic),
      body: plainText(content),
    });
  }

  for (const [directory, kind, base] of [
    ["care", "care", "/care"],
    ["tips", "tip", "/tips"],
  ] as const) {
    for (const { slug, data, content } of await readCollection(directory)) {
      if (data.draft === true) continue;
      records.push({
        id: `${kind}:${slug}`,
        kind,
        title: asString(data.title),
        summary: asString(data.description),
        url: `${base}/${slug}`,
        keywords: asArray(data.tags).join(" "),
        body: plainText(content),
      });
    }
  }

  // Challenges are TypeScript, so their titles and briefs are lifted with a narrow regex rather
  // than by importing modules that pull in the whole simulator.
  const challengeDir = path.join(ROOT, "content", "challenges");
  const challengeFiles = await readdir(challengeDir).catch(() => []);
  for (const name of challengeFiles.filter((file) => file.endsWith(".ts"))) {
    const source = await readFile(path.join(challengeDir, name), "utf8");
    const entries = source.matchAll(
      /id:\s*"([a-z0-9-]+)"[\s\S]{0,400}?title:\s*"([^"]+)"[\s\S]{0,400}?brief:\s*\n?\s*"([^"]+)"/g,
    );

    for (const match of entries) {
      const [, id, title, brief] = match;
      if (!id || !title || !brief) continue;

      const url = name.startsWith("diagnose")
        ? `/practice/diagnose/${id}`
        : name.startsWith("match")
          ? `/practice/match/${id}`
          : name.startsWith("metering")
            ? `/practice/metering/${id}`
            : `/practice/${id}`;

      records.push({
        id: `challenge:${id}`,
        kind: "challenge",
        title,
        summary: brief.slice(0, 160),
        url,
        keywords: "practice challenge simulator",
        body: brief,
      });
    }
  }

  const outDir = path.join(ROOT, "public");
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "search-index.json"), JSON.stringify(records));

  process.stdout.write(`search index: ${records.length.toString()} records\n`);
}

await build();
