"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";

interface SearchRecord {
  readonly id: string;
  readonly kind: "lesson" | "glossary" | "faq" | "care" | "tip" | "challenge";
  readonly title: string;
  readonly summary: string;
  readonly url: string;
  readonly keywords: string;
  readonly body: string;
}

const KIND_LABELS: Readonly<Record<SearchRecord["kind"], string>> = {
  lesson: "Lesson",
  glossary: "Glossary",
  faq: "FAQ",
  care: "Care",
  tip: "Tip",
  challenge: "Practice",
};

/**
 * Client-side search over a static index.
 *
 * The index is fetched on first interaction rather than on page load: most visitors never search,
 * and making them pay for it would slow the pages that actually matter. Until then this is an
 * input and nothing else.
 */
export function SearchClient() {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<readonly SearchRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const loadStarted = useRef(false);
  const inputId = useId();

  const load = useCallback(async () => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    setLoading(true);

    try {
      const response = await fetch("/search-index.json");
      const data: unknown = await response.json();
      setRecords(Array.isArray(data) ? (data as SearchRecord[]) : []);
    } catch {
      // A failed index fetch leaves search unavailable rather than breaking the page.
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const results = search(records, query);

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium">
        Search
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          // Fetching belongs to the keystroke that needs it, not to an effect watching the
          // query — which React 19 rightly flags as a cascading render.
          void load();
        }}
        onFocus={() => {
          void load();
        }}
        placeholder="aperture, bokeh, cleaning a lens…"
        autoComplete="off"
        className="mt-2 w-full rounded-md border border-rule bg-surface px-3 py-2.5"
      />

      <p aria-live="polite" className="mt-3 text-sm text-ink-muted">
        {query.length === 0
          ? "Type to search lessons, the glossary, the FAQ and the practice challenges."
          : loading
            ? "Loading…"
            : `${results.length.toString()} ${results.length === 1 ? "result" : "results"}`}
      </p>

      {results.length > 0 && (
        <ul className="mt-4 flex flex-col">
          {results.map((record) => (
            <li key={record.id} className="border-b border-rule py-4">
              <p className="text-xs text-ink-faint">{KIND_LABELS[record.kind]}</p>
              <h2 className="mt-0.5 font-semibold">
                <Link href={record.url} className="hover:text-accent">
                  {record.title}
                </Link>
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {record.summary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Ranked substring matching over the fields, weighted so a title hit beats a body hit.
 *
 * Deliberately not a fuzzy-search library. The corpus is a few hundred short records and every
 * term is one a reader typed on purpose, so a library would cost more bytes than the index it
 * searches — which on a site whose selling point is speed is the wrong trade.
 */
function search(records: readonly SearchRecord[] | null, query: string): readonly SearchRecord[] {
  const trimmed = query.trim().toLowerCase();
  if (!records || trimmed.length === 0) return [];

  const terms = trimmed.split(/\s+/);

  return records
    .map((record) => {
      let score = 0;

      for (const term of terms) {
        if (record.title.toLowerCase().includes(term)) score += 10;
        if (record.keywords.toLowerCase().includes(term)) score += 6;
        if (record.summary.toLowerCase().includes(term)) score += 3;
        if (record.body.toLowerCase().includes(term)) score += 1;
      }

      return { record, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title))
    .slice(0, 25)
    .map((entry) => entry.record);
}
