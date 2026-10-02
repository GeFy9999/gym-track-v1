import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.webp" alt="GymsTrack" width={24} height={24} className="rounded-md" />
          <span className="text-sm font-bold text-[#191714]">GymsTrack</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-[#191714]/50">
          <a
            href="https://gymstrack.com/privacy"
            className="hover:text-[#191714] transition-colors"
          >
            Confidentialité
          </a>
          <a
            href="https://gymstrack.com/terms"
            className="hover:text-[#191714] transition-colors"
          >
            Conditions
          </a>
          <a
            href="https://gymstrack.com/legal"
            className="hover:text-[#191714] transition-colors"
          >
            Mentions légales
          </a>
        </div>

        <p className="text-xs text-[#191714]/40">
          © {new Date().getFullYear()} GymsTrack. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
