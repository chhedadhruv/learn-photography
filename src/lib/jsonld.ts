import { SITE } from "./site";

/**
 * Structured data.
 *
 * Hand-typed rather than pulled from a schema library: the shapes used here are few and stable,
 * and a dependency would buy little beyond a large type surface. Every builder returns a plain
 * object that is serialised into a script tag by `JsonLd`.
 *
 * The rule that matters: structured data must describe what is actually on the page. Markup that
 * claims an FAQ the reader cannot see is a manual penalty waiting to happen, so every builder
 * here takes the same data the page renders from.
 */

interface JsonLdObject {
  readonly "@context"?: string;
  readonly "@type": string;
  readonly [key: string]: unknown;
}

const absolute = (path: string) => `${SITE.url}${path}`;

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en-GB",
    publisher: { "@type": "Person", name: SITE.author },
  };
}

export interface Crumb {
  readonly href: string;
  readonly label: string;
}

export function breadcrumbJsonLd(crumbs: readonly Crumb[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: absolute(crumb.href),
    })),
  };
}

export interface ArticleMeta {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly publishedAt: string;
  readonly updatedAt?: string | undefined;
}

export function articleJsonLd(meta: ArticleMeta): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    url: absolute(meta.path),
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt ?? meta.publishedAt,
    author: { "@type": "Person", name: SITE.author },
    publisher: { "@type": "Person", name: SITE.author },
    inLanguage: "en-GB",
    mainEntityOfPage: { "@type": "WebPage", "@id": absolute(meta.path) },
  };
}

/**
 * `HowTo` for genuinely step-by-step pieces, with the steps taken from the article's own
 * headings — so the markup cannot describe steps the page does not have.
 */
export function howToJsonLd(
  meta: ArticleMeta,
  steps: readonly { readonly text: string; readonly id: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: meta.title,
    description: meta.description,
    url: absolute(meta.path),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.text,
      url: `${absolute(meta.path)}#${step.id}`,
    })),
  };
}

export function faqJsonLd(
  entries: readonly { readonly question: string; readonly answer: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export interface LearningResourceMeta {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly level: string;
}

/** Practice pages are interactive exercises rather than articles, and say so. */
export function learningResourceJsonLd(meta: LearningResourceMeta): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: meta.title,
    description: meta.description,
    url: absolute(meta.path),
    learningResourceType: "Interactive exercise",
    educationalLevel: meta.level,
    inLanguage: "en-GB",
    provider: { "@type": "Person", name: SITE.author },
  };
}

export function definedTermJsonLd(meta: {
  readonly term: string;
  readonly summary: string;
  readonly path: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: meta.term,
    description: meta.summary,
    url: absolute(meta.path),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${SITE.name} glossary`,
      url: absolute("/glossary"),
    },
  };
}
