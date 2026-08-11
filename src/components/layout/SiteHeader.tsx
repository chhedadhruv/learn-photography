"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ApertureMark } from "@/components/brand/ApertureMark";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ZoneStrip } from "@/components/layout/ZoneStrip";
import { PRIMARY_NAV, SITE } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink transition-colors hover:text-accent"
        >
          <ApertureMark size={26} decorative />
          <span className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">
            {SITE.name}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={[
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isCurrent(item.href)
                  ? "text-accent"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => {
            setMenuOpen((open) => !open);
          }}
          className="rounded-md border border-rule px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-raised md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen ? (
        <div id={menuId} className="border-t border-rule md:hidden">
          <nav aria-label="Primary" className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <ul className="flex flex-col gap-1">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    // Dismissing on navigation belongs to the click that caused it, not to an
                    // effect watching the pathname.
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                    className="flex flex-col rounded-md px-3 py-2.5 hover:bg-surface-raised"
                  >
                    <span
                      className={[
                        "text-sm font-medium",
                        isCurrent(item.href) ? "text-accent" : "text-ink",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs text-ink-muted">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-rule pt-3">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      ) : null}

      <ZoneStrip />
    </header>
  );
}
