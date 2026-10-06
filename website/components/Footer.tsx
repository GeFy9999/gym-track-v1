import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/dictionaries";

type Props = {
  dict: Dictionary["footer"];
  locale: Locale;
};

export default function Footer({ dict, locale }: Props) {
  return (
    <footer className="border-t border-black/5 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Image src="/logo.webp" alt="GymsTrack" width={74} height={28} />

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[#191714]/50">
          <Link href={`/${locale}/privacy`} className="hover:text-[#191714] transition-colors">
            {dict.privacy}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-[#191714] transition-colors">
            {dict.terms}
          </Link>
          <Link href={`/${locale}/legal`} className="hover:text-[#191714] transition-colors">
            {dict.legal}
          </Link>
          <Link href={`/${locale}/contact`} className="hover:text-[#191714] transition-colors">
            {dict.contact}
          </Link>
        </div>

        <p className="text-xs text-[#191714]/40">
          © {new Date().getFullYear()} GymsTrack. {dict.rights}
        </p>
      </div>
    </footer>
  );
}
