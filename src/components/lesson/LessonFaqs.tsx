interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * Per-lesson questions, rendered with native `<details>` so they are keyboard-operable and
 * findable by in-page search without any JavaScript. Phase 9 emits the matching FAQPage JSON-LD
 * from the same frontmatter array.
 */
export function LessonFaqs({ faqs }: { readonly faqs: readonly Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="lesson-faqs" className="mt-14">
      <h2 id="lesson-faqs" className="text-2xl font-semibold">
        Common questions
      </h2>
      <div className="mt-5 flex flex-col">
        {faqs.map((faq) => (
          <details key={faq.question} className="border-b border-rule py-4">
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              {faq.question}
            </summary>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
