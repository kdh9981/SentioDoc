import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['geoip-lite'],
  // Increase body size limit for file uploads (100MB)
  experimental: {
    proxyClientMaxBodySize: '100mb',
  },
};

export default nextConfig;
