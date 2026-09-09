import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  // A native module: it has a .node binary the bundler must not try to parse
  // or rewrite, and it is required at runtime from node_modules as-is.
  serverExternalPackages: ["better-sqlite3"],
  // The database is opened by path at runtime, so file tracing cannot find it
  // by following imports. Without this the deployed functions get everything
  // except the data they read.
  outputFileTracingIncludes: {
    "/**": [".data/**"],
  },
  images: {
    // The seeded art is already webp and avif; these are the formats the
    // optimizer negotiates down to for the resized variants it generates.
    formats: ["image/avif", "image/webp"],
    // The widths a phone, a tablet and a desktop actually ask for here. The
    // default scale runs to 3840, which builds variants nothing requests.
    deviceSizes: [390, 640, 828, 1080, 1440, 1920],
  },
  async headers() {
    return [
      {
        source: "/video/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
