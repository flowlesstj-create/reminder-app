import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sequelize", "sqlite3"],
  output: "standalone",
};

export default nextConfig;
