import type { Heading } from "@/lib/content/schema";

/**
 * Section list for a lesson. Ids come from `extractHeadings`, which uses the same slugger as
 * rehype-slug, so every link here resolves to a heading that exists on the page.
 */
export function TableOfContents({ headings }: { readonly headings: readonly Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav aria-labelledby="toc-heading" className="text-sm">
      <h2
        id="toc-heading"
        className="text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase"
      >
        On this page
      </h2>
      <ol className="mt-3 flex flex-col gap-2 border-l border-rule pl-4">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? "pl-3" : undefined}>
            <a href={`#${heading.id}`} className="block text-ink-muted hover:text-accent">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
