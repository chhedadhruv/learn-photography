"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * `attribute="class"` pairs with the `dark` custom variant in globals.css. next-themes injects
 * a blocking script so the class is set before first paint — without it the page flashes the
 * wrong theme on load.
 */
export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
