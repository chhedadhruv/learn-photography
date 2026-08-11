import type { NextConfig } from "next";

/**
 * Headers applied to every response.
 *
 * Vercel handles HSTS and compression itself, so these are the ones it does not: stopping the
 * browser guessing content types, limiting what is leaked in a Referer to another origin, and
 * turning off device APIs this site has no use for.
 *
 * No Content-Security-Policy yet. Getting one right for a Next.js app needs per-request nonces,
 * and a wrong one silently breaks the simulator rather than failing loudly — worth doing
 * deliberately rather than as a deploy-day afterthought.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  headers() {
    return Promise.resolve([
      { source: "/:path*", headers: securityHeaders },
      {
        // The search index is rebuilt on every deploy and never changes in between, so it can be
        // cached hard and revalidated in the background.
        source: "/search-index.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ]);
  },
};

export default nextConfig;
