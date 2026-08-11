/**
 * The lesson taxonomy.
 *
 * Category slugs share the `/learn/*` namespace with lesson slugs, so `loader.ts` asserts at
 * build time that no lesson claims a slug listed here.
 */
/**
 * Declared as a literal tuple so `z.enum` can consume it directly. Deriving it from
 * `CATEGORIES.map(...)` would widen it to `string[]` and lose the union.
 */
export const CATEGORY_SLUGS = [
  "camera-basics",
  "exposure-and-settings",
  "composition",
  "lighting",
  "genres",
  "post-processing",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

interface Category {
  readonly slug: CategorySlug;
  readonly name: string;
  readonly blurb: string;
}

export const CATEGORIES: readonly Category[] = [
  {
    slug: "camera-basics",
    name: "Camera Basics",
    blurb: "What the parts do, and how to hold, set up and carry a camera.",
  },
  {
    slug: "exposure-and-settings",
    name: "Exposure & Settings",
    blurb: "Shutter speed, aperture, ISO, metering and the modes that combine them.",
  },
  {
    slug: "composition",
    name: "Composition",
    blurb: "Where to put things in the frame, and why it changes the photograph.",
  },
  {
    slug: "lighting",
    name: "Lighting",
    blurb: "Reading available light, and shaping it when you need to.",
  },
  {
    slug: "genres",
    name: "Genres",
    blurb: "Portraits, landscape, street and macro, and what each one demands.",
  },
  {
    slug: "post-processing",
    name: "Post-Processing",
    blurb: "A first pass at editing: what to fix, and what to leave alone.",
  },
];

const BY_SLUG = new Map<string, Category>(CATEGORIES.map((category) => [category.slug, category]));

export function getCategory(slug: string): Category | undefined {
  return BY_SLUG.get(slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return BY_SLUG.has(slug);
}

export const DIFFICULTIES = ["beginner", "intermediate"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
};
