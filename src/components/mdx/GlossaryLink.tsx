import Link from "next/link";

/**
 * A link from a lesson to a glossary definition.
 *
 * Beginners meet jargon constantly, and sending them to a definition without losing their place
 * is most of what a glossary is for. The term's existence is checked when content is loaded
 * rather than when this renders, so a broken reference fails the build with a filename instead
 * of shipping a dead link.
 */
export function GlossaryLink({
  term,
  children,
}: {
  readonly term: string;
  readonly children?: React.ReactNode;
}) {
  return (
    <Link
      href={`/glossary/${term}`}
      className="underline decoration-dotted underline-offset-[0.2em]"
    >
      {children ?? term.replace(/-/g, " ")}
    </Link>
  );
}
