import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllTerms } from "@/lib/content/glossary";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const CRUMBS = [
  { href: "/", label: "Home" },
  { href: "/glossary", label: "Glossary" },
];

export const metadata: Metadata = buildMetadata({
  title: "Glossary",
  description:
    "Plain-English definitions of the photography words that trip beginners up, from aperture to depth of field.",
  path: "/glossary",
});

export default async function GlossaryIndexPage() {
  const terms = await getAllTerms();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Breadcrumbs crumbs={CRUMBS} />

      <h1 className="mt-6 text-4xl font-semibold">Glossary</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">
        The words that get used as though everybody already knows them.
      </p>

      {terms.length === 0 ? (
        <p className="mt-10 text-ink-muted">Nothing defined yet.</p>
      ) : (
        <dl className="mt-10 flex flex-col">
          {terms.map((entry) => (
            <div key={entry.slug} className="border-b border-rule py-5">
              <dt className="text-lg font-semibold">
                <Link href={`/glossary/${entry.slug}`} className="hover:text-accent">
                  {entry.frontmatter.term}
                </Link>
              </dt>
              <dd className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {entry.frontmatter.summary}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
