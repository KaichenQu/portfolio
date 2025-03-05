import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["fonts.googleapis.com"],
  },
  /* config options here */
  async redirects() {
    return [
      {
        source: "www.kelsonqu.com",
        destination: "https://kelsonqu.com",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
