import type { Metadata } from "next";
import "./globals.css";

// Placeholder only. Phase 1 replaces this with the shared metadata builder in `src/lib/seo.ts`,
// which every route composes so no page can ship without title, description and canonical URL.
export const metadata: Metadata = {
  title: "Learn Photography",
  description:
    "Interactive photography lessons and a browser-based camera simulator for beginners.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
