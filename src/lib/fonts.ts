import { Fraunces, Inter } from "next/font/google";

/**
 * Both faces are variable and self-hosted at build time by `next/font` — no runtime request
 * to Google, and no layout shift because the metrics are known ahead of time.
 */

/** Display face. Warm, slightly wonky serif that keeps long-form teaching from reading clinical. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

/** Body face. Chosen for legibility at small sizes on phones, which is where lessons get read. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
