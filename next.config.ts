import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['langfuse', 'langsmith'],
};

export default nextConfig;
