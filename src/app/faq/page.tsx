import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFaqByTopic } from "@/lib/content/faq";
import { MdxContent } from "@/lib/content/mdx";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";

const CRUMBS = [
  { href: "/", label: "Home" },
  { href: "/faq", label: "FAQ" },
];

export const metadata: Metadata = buildMetadata({
  title: "Frequently asked questions",
  description:
    "Straight answers to the questions beginners actually ask about cameras, settings and looking after your kit.",
  path: "/faq",
});

export default async function FaqPage() {
  const topics = await getFaqByTopic();

  // The structured data is built from the same entries the page renders, so it cannot claim a
  // question the reader cannot see — which is what gets a site penalised.
  const all = topics.flatMap((topic) => topic.entries);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      {all.length > 0 && (
        <JsonLd
          data={faqJsonLd(
            all.map((entry) => ({
              question: entry.frontmatter.question,
              answer: entry.body.trim(),
            })),
          )}
        />
      )}
      <Breadcrumbs crumbs={CRUMBS} />

      <h1 className="mt-6 text-4xl font-semibold">Frequently asked questions</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">
        The questions that come up first, grouped by what they are about.
      </p>

      {topics.length === 0 ? (
        <p className="mt-10 text-ink-muted">No questions answered yet.</p>
      ) : (
        <div className="mt-12 flex flex-col gap-12">
          {topics.map((topic) => (
            <section key={topic.topic} aria-labelledby={`topic-${topic.topic}`}>
              <h2 id={`topic-${topic.topic}`} className="text-2xl font-semibold">
                {topic.topic}
              </h2>

              <div className="mt-4 flex flex-col">
                {topic.entries.map((entry) => (
                  <details key={entry.slug} className="border-b border-rule py-4">
                    <summary className="cursor-pointer list-none font-medium marker:hidden">
                      {entry.frontmatter.question}
                    </summary>
                    <div className="prose mt-3 text-sm">
                      <MdxContent source={entry.body} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
