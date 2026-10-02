import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "./dictionaries/types";

// Mirrors the main app's language detection: browser locale decides a new
// visitor's default, a saved choice (here a cookie, there localStorage)
// always wins after that.
function getPreferredLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale as (typeof locales)[number])) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage?.toLowerCase().startsWith("en")) return "en";

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (pathnameHasLocale) return;

  const locale = getPreferredLocale(request);
  const url = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip static files, images, and Next internals.
    "/((?!_next|favicon.ico|icon.png|apple-icon.png|logo.webp).*)",
  ],
};
