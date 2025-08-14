import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    PROXY_TIMEOUT_MS: process.env.PROXY_TIMEOUT_MS,
  },
};

export default nextConfig;
