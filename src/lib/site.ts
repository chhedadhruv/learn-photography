/**
 * Single source of truth for anything that needs to know where the site lives.
 *
 * Canonical URLs, sitemap entries, robots directives and Open Graph tags all derive from
 * `SITE_URL`, so the subdomain is stated once rather than inferred per-request.
 */
export const SITE = {
  name: "Learn Photography",
  url: "https://learn.dhruvchheda.com",
  description:
    "Interactive photography lessons and a browser-based camera simulator for beginners.",
  author: "Dhruv Chheda",
  locale: "en_GB",
} as const;

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly description: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/learn", label: "Learn", description: "Lessons by topic" },
  { href: "/practice", label: "Practice", description: "Camera simulator challenges" },
  { href: "/care", label: "Care", description: "Looking after your kit" },
  { href: "/glossary", label: "Glossary", description: "Plain-English definitions" },
] as const;
