import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { fraunces, inter } from "@/lib/fonts";
import { SITE } from "@/lib/site";
import "./globals.css";

// Phase 2 replaces per-page metadata with the shared builder in `src/lib/seo.ts`. This root
// entry supplies the title template and the defaults every page inherits.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Camera Basics, Exposure and Care for Beginners`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only rounded-md bg-surface px-4 py-2 text-ink focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-100 focus-visible:outline-focus"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
