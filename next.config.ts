import type { NextConfig } from "next";

/**
 * The API lives in a separate service (wascat-backend) now. Two things keep
 * that invisible from outside:
 *
 *  - Every documented `/api/v1/...` URL is rewritten to it, so the endpoints
 *    /api-docs describes and the homepage's metadata download keep working on
 *    this site's own origin.
 *  - Because the browser only ever talks to this origin, the dashboard's
 *    session cookies stay same-origin: no CORS preflight, no third-party
 *    cookie problem, nothing to configure per environment.
 */
const API_ORIGIN = process.env.WASCAT_API_ORIGIN ?? "http://127.0.0.1:8000";

/** Where frames are served from, so next/image will optimise them. */
const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "";
const assetUrl = assetBase ? new URL(assetBase) : null;

const nextConfig: NextConfig = {
  ...(process.env.WASCAT_STANDALONE === "1"
    ? { output: "standalone" as const }
    : {}),
  poweredByHeader: false,

  images: {
    // Frames come from object storage rather than public/ now. Only the
    // configured host is listed, so this cannot become an open image proxy.
    remotePatterns: assetUrl
      ? [
          {
            protocol: assetUrl.protocol.replace(":", "") as "http" | "https",
            hostname: assetUrl.hostname,
            ...(assetUrl.port ? { port: assetUrl.port } : {}),
            pathname: `${assetUrl.pathname.replace(/\/$/, "")}/**`,
          },
        ]
      : [],
  },

  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // Scoped to the public read API. This previously matched all of
        // /api/:path*, which would hand `Access-Control-Allow-Origin: *` and a
        // shared cache policy to the authenticated dashboard endpoints as soon
        // as they exist.
        source: "/api/v1/:path((?!admin).*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        source: "/api/v1/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Vary", value: "Origin, Cookie" },
        ],
      },
    ];
  },
};

export default nextConfig;
