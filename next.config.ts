import type { NextConfig } from "next";
import { lanDevOrigins } from "./lib/lan-origins";

const lanOrigins = lanDevOrigins();

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Dev-only: other devices on Wi-Fi load JS/HMR from this computer's LAN IP,
  // which Next.js treats as cross-origin unless we allow it.
  allowedDevOrigins: lanOrigins,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    serverActions: {
      allowedOrigins: lanOrigins,
    },
  },
  async redirects() {
    return [
      { source: "/runs", destination: "/app/runs", permanent: true },
      { source: "/runs/:id", destination: "/app/runs/:id", permanent: true },
    ];
  },
};

export default nextConfig;
