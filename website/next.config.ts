import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This site lives inside the gym-track-v1 repo, which has its own
  // top-level package-lock.json — without this, Next.js misidentifies that
  // as the workspace root instead of website/.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
