import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // This site lives inside the gym-track-v1 repo, which has its own
  // top-level package-lock.json — without this, Next.js misidentifies that
  // as the workspace root instead of website/.
  turbopack: {
    root: path.join(__dirname),
  },
  // Pure marketing content, no server-side data — ship it as static HTML so
  // it can be served by plain nginx, same as the main app's frontend.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
