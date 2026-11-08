import Image from "next/image";
import type { Dictionary, Locale } from "@/dictionaries";

const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.gymstrack.app";

type Props = {
  dict: Dictionary["hero"];
  locale: Locale;
};

export default function Hero({ dict, locale }: Props) {
  const appStoreBadge = locale === "fr" ? "/app-store-badge-fr.svg" : "/app-store-badge-en.svg";
  const googlePlayBadge =
    locale === "fr" ? "/google-play-badge-fr.png" : "/google-play-badge-en.png";

  return (
    <section className="relative min-h-[calc(100vh-6rem)] flex items-center justify-center overflow-hidden">
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-3xl">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] tracking-tight">
          {dict.title[0]}
          <br />
          {dict.title[1]}
        </h1>
        <p className="text-base sm:text-lg text-white/70 mt-6 max-w-lg mx-auto leading-relaxed">
          {dict.subtitle}
        </p>

        <div id="telecharger" className="flex flex-wrap items-center justify-center gap-4 mt-9">
          {/* Apple's badge SVG and Google's PNG have different native aspect ratios
              (and Google's reads visually smaller at an equal height), so these use
              independently tuned heights rather than one shared height/width. */}
          {/* Not on the App Store yet: greyed out, not clickable, with a
              "coming soon" tag. */}
          <div
            aria-disabled="true"
            className="relative block cursor-default select-none"
            title={dict.appStoreSoon}
          >
            <Image
              src={appStoreBadge}
              alt={`App Store — ${dict.appStoreSoon}`}
              width={144}
              height={48}
              className="grayscale opacity-40"
            />
            <span className="absolute -top-2.5 -right-2.5 text-[10px] font-bold uppercase tracking-wide bg-[#c9552c] text-white px-2 py-0.5 rounded-full shadow-sm">
              {dict.appStoreSoon}
            </span>
          </div>
          <a
            href={GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block opacity-90 hover:opacity-100 transition-opacity"
          >
            <Image src={googlePlayBadge} alt="Google Play" width={160} height={62} />
          </a>
        </div>
      </div>
    </section>
  );
}
