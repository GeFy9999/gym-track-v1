import type { NextConfig } from "next";
import path from "path";

// Same baseline as the app's nginx config (frontend/nginx-security-headers.conf).
// No script-src CSP: Google Sign-In loads its own scripts and frames, and a
// too-strict allowlist would silently break it.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), payment=(), usb=(), camera=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // This site lives inside the gym-track-v1 repo, which has its own
  // top-level package-lock.json — without this, Next.js misidentifies that
  // as the workspace root instead of website/.
  turbopack: {
    root: path.join(__dirname),
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
