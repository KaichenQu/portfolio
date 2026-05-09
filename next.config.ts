import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/www.kelsonqu.com",
        destination: "https://kelsonqu.com",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
