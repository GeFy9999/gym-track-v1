import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// /robots.txt — the marketing and legal pages are open to crawlers; account
// pages (login, signup, password reset, email verification) have nothing to
// rank and are kept out.
const ACCOUNT_PAGES = [
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "verify-email-pending",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ACCOUNT_PAGES.map((page) => `/*/${page}`),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
