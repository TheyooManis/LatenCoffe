import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "exceljs", "@base-ui/react"],
  },
};

export default nextConfig;
