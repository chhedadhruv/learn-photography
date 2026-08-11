import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Scoped to this subdomain only.
 *
 * A robots file governs the host that serves it, so this one must never make claims about the
 * root domain. The sitemap is stated absolutely for the same reason: a relative path here would
 * be ambiguous about which host it belongs to.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing is generated here that is worth crawling but not worth reading.
        disallow: [],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
