import Link from "next/link";
import { ApertureMark } from "@/components/brand/ApertureMark";
import { PRIMARY_NAV, SITE } from "@/lib/site";

const SECONDARY_LINKS = [
  { href: "/start-here", label: "Start here" },
  { href: "/tips", label: "Tips" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 text-ink">
              <ApertureMark size={22} decorative />
              <span className="font-[family-name:var(--font-heading)] font-semibold">
                {SITE.name}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Learn how a camera actually works, then prove it in the simulator.
            </p>
          </div>

          <div className="flex gap-12">
            <FooterColumn title="Learn" links={PRIMARY_NAV} />
            <FooterColumn title="More" links={SECONDARY_LINKS} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-6 text-xs text-ink-faint sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear().toString()} {SITE.author}
          </p>
          <p>Built to be practised, not just read.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  readonly title: string;
  readonly links: readonly { readonly href: string; readonly label: string }[];
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-[0.08em] text-ink-faint uppercase">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-ink-muted hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
