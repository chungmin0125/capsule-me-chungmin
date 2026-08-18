import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/google251949f12a1c72db.html",
        destination: "/api/google-site-verification",
      },
    ];
  },
};

export default nextConfig;
