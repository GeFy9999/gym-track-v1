import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-[#faf6f1]/90 backdrop-blur-sm border-b border-black/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.webp" alt="GymsTrack" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-black tracking-tight text-[#191714]">
            GymsTrack
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#191714]/70">
          <a href="#fonctionnalites" className="hover:text-[#191714] transition-colors">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="hover:text-[#191714] transition-colors">
            Tarifs
          </a>
          <a href="#faq" className="hover:text-[#191714] transition-colors">
            FAQ
          </a>
        </nav>

        <a
          href="#telecharger"
          className="bg-[#c9552c] text-white text-sm font-bold uppercase tracking-wide px-5 py-2.5 rounded-full shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Télécharger
        </a>
      </div>
    </header>
  );
}
