import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SearchClient } from "@/components/search/SearchClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search the lessons, glossary, FAQ and practice challenges.",
  path: "/search",
});

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Breadcrumbs
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/search", label: "Search" },
        ]}
      />

      <h1 className="mt-6 text-4xl font-semibold">Search</h1>

      <div className="mt-8">
        <SearchClient />
      </div>
    </div>
  );
}
