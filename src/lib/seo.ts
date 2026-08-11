import type { Metadata } from "next";
import { SITE } from "./site";

/**
 * One builder every page composes, so no page can ship without a title, a description and a
 * canonical URL.
 *
 * Canonical URLs come from `SITE.url` rather than from the request, because this site lives on a
 * subdomain of another one: an inferred origin would eventually emit a canonical pointing at the
 * wrong host, and the two would compete for the same rankings.
 */
export interface PageMeta {
  readonly title: string;
  readonly description: string;
  /** Path only, beginning with a slash. */
  readonly path: string;
  /** ISO dates, for article pages. */
  readonly publishedAt?: string | undefined;
  readonly updatedAt?: string | undefined;
  readonly type?: "website" | "article";
}

export function buildMetadata(meta: PageMeta): Metadata {
  const url = `${SITE.url}${meta.path}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type: meta.type ?? "website",
      ...(meta.publishedAt === undefined ? {} : { publishedTime: meta.publishedAt }),
      ...(meta.updatedAt === undefined ? {} : { modifiedTime: meta.updatedAt }),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}
