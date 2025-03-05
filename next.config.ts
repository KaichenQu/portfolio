import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["fonts.googleapis.com"],
  },
  /* config options here */
};

export default nextConfig;
