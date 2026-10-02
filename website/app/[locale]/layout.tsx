import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary, locales, type Locale } from "@/dictionaries";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const siteUrl = "https://gymstrack.app";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const dict = getDictionary(locale as Locale);

  return {
    metadataBase: new URL(siteUrl),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      languages: { fr: "/fr", en: "/en" },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: `${siteUrl}/${locale}`,
      siteName: "GymsTrack",
      locale: locale === "fr" ? "fr_CA" : "en_US",
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  return (
    <html lang={locale} className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#faf6f1] font-sans">
        {children}
      </body>
    </html>
  );
}
