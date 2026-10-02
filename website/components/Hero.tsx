import Image from "next/image";
import type { Dictionary, Locale } from "@/dictionaries";

type Props = {
  dict: Dictionary["hero"];
  locale: Locale;
};

export default function Hero({ dict, locale }: Props) {
  const appStoreBadge = locale === "fr" ? "/app-store-badge-fr.svg" : "/app-store-badge-en.svg";
  const googlePlayBadge =
    locale === "fr" ? "/google-play-badge-fr.png" : "/google-play-badge-en.png";

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      <div className="relative z-10 text-center px-6 max-w-3xl">
        <h1 className="text-5xl sm:text-7xl font-black text-white leading-[1.05] tracking-tight">
          {dict.title[0]}
          <br />
          {dict.title[1]}
        </h1>
        <p className="text-base sm:text-lg text-white/70 mt-6 max-w-lg mx-auto leading-relaxed">
          {dict.subtitle}
        </p>

        <div id="telecharger" className="flex flex-wrap items-center justify-center gap-3 mt-9">
          {/* Real store links will replace "#" once GymsTrack is actually published. */}
          <a href="#" className="block opacity-90 hover:opacity-100 transition-opacity">
            <Image src={appStoreBadge} alt="App Store" width={160} height={54} />
          </a>
          <a href="#" className="block opacity-90 hover:opacity-100 transition-opacity">
            <Image
              src={googlePlayBadge}
              alt="Google Play"
              width={180}
              height={54}
              className="h-[54px] w-auto"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
