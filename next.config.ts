import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 禁用 Strict Mode（仅开发环境有影响）
  reactCompiler: true,
  output: "standalone",
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
