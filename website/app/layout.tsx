import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const siteUrl = "https://gymstrack.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "GymsTrack — Suis tes séances, progresse chaque semaine",
  description:
    "L'app de suivi de musculation simple et puissante : séances guidées, graphiques de progression, records personnels et photos de progrès. Disponible sur iOS et Android.",
  openGraph: {
    title: "GymsTrack — Suis tes séances, progresse chaque semaine",
    description:
      "L'app de suivi de musculation simple et puissante : séances guidées, graphiques de progression, records personnels et photos de progrès.",
    url: siteUrl,
    siteName: "GymsTrack",
    locale: "fr_CA",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GymsTrack — Suis tes séances, progresse chaque semaine",
    description:
      "L'app de suivi de musculation simple et puissante : séances guidées, graphiques de progression, records personnels et photos de progrès.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#faf6f1] font-sans">
        {children}
      </body>
    </html>
  );
}
