import Link from "next/link";

export interface Crumb {
  readonly href: string;
  readonly label: string;
}

/**
 * Visual breadcrumbs only. Phase 9 adds the matching `BreadcrumbList` JSON-LD, built from the
 * same `crumbs` array so the markup and the structured data cannot drift apart.
 */
export function Breadcrumbs({ crumbs }: { readonly crumbs: readonly Crumb[] }) {
  if (crumbs.length === 0) return null;

  const last = crumbs[crumbs.length - 1];

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb) => {
          const isLast = crumb === last;

          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-ink">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link href={crumb.href} className="hover:text-accent">
                    {crumb.label}
                  </Link>
                  <span aria-hidden="true" className="text-ink-faint">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
