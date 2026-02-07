import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ensures all assets are properly versioned
  reactCompiler: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/:path*", // matches all routes
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache", // ensures HTML pages are always fresh
          },
        ],
      },
    ];
  },
};

export default nextConfig;
