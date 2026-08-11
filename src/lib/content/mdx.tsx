import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import rehypeAutolinkHeadings, { type Options as AutolinkOptions } from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkSmartypants from "remark-smartypants";
import { Callout } from "@/components/mdx/Callout";
import { Figure } from "@/components/mdx/Figure";
import { KeyTakeaways } from "@/components/mdx/KeyTakeaways";

/**
 * Links written as plain markdown still need to behave correctly: internal ones go through
 * next/link for client navigation, external ones open safely and say so.
 *
 * Only the props MDX actually produces are accepted. Spreading the full anchor prop set into
 * `Link` fails under `exactOptionalPropertyTypes`, and none of those props are reachable from
 * markdown anyway.
 */
function MdxLink({
  href = "",
  children,
  className,
  title,
}: {
  readonly href?: string;
  readonly children?: ReactNode;
  readonly className?: string;
  readonly title?: string;
}) {
  const isInternal = href.startsWith("/") || href.startsWith("#");

  if (isInternal) {
    return (
      <Link href={href} className={className} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} title={title} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * A bare markdown image cannot carry the dimensions `next/image` needs, and it makes empty alt
 * text easy to ship. Authors use `<Figure>` instead, and this says so at build time rather than
 * silently rendering an unoptimised tag.
 */
function RejectBareImage({ src = "" }: { readonly src?: string }): never {
  throw new Error(
    `Markdown image syntax is not supported (src: "${src}"). Use ` +
      `<Figure src="…" alt="…" width={…} height={…} /> so the image is optimised and described.`,
  );
}

const components = {
  a: MdxLink,
  img: RejectBareImage,
  Callout,
  Figure,
  KeyTakeaways,
};

/**
 * Declared as an explicit tuple. Written inline, TypeScript infers `[plugin, options]` as an
 * array union rather than the pair `PluggableList` requires.
 *
 * Wrapping puts the anchor around the heading text so a reader can link to a section; the
 * heading itself stays the navigable landmark, so nothing is hidden from assistive tech.
 */
const autolinkHeadings: [typeof rehypeAutolinkHeadings, AutolinkOptions] = [
  rehypeAutolinkHeadings,
  // hast expects className as a list of tokens, not a single string.
  { behavior: "wrap", properties: { className: ["heading-anchor"] } },
];

const options = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkSmartypants],
    rehypePlugins: [rehypeSlug, autolinkHeadings],
  },
};

export function MdxContent({ source }: { readonly source: string }) {
  return <MDXRemote source={source} components={components} options={options} />;
}
