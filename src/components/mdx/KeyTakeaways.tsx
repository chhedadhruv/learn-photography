import type { ReactNode } from "react";

/**
 * The summary a reader should leave with. Rendered as a labelled region so it can be jumped to
 * directly, and placed at the end of a lesson by convention.
 */
export function KeyTakeaways({ children }: { readonly children: ReactNode }) {
  return (
    <section
      aria-labelledby="key-takeaways"
      className="my-10 rounded-md border border-rule bg-surface-raised p-6"
    >
      <h2 id="key-takeaways" className="mt-0 mb-4 text-lg font-semibold">
        Key takeaways
      </h2>
      <div className="[&>ul]:my-0 [&>ul]:pl-5">{children}</div>
    </section>
  );
}
