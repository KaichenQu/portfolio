import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
