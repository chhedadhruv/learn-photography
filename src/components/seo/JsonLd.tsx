/**
 * Renders structured data.
 *
 * `JSON.stringify` output has `<` escaped so a stray sequence in a description cannot close the
 * script tag early — the one XSS-shaped hazard in an otherwise inert feature.
 */
export function JsonLd({ data }: { readonly data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
