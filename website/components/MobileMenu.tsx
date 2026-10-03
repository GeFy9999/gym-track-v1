"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Dictionary, Locale } from "@/dictionaries";

type Props = {
  dict: Dictionary["nav"];
  locale: Locale;
};

// Nav's own links are "hidden md:flex" — below that breakpoint they'd
// otherwise just disappear with no way to reach them at all.
export default function MobileMenu({ dict, locale }: Props) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#fonctionnalites", label: dict.features },
    { href: "#tarifs", label: dict.pricing },
    { href: "#faq", label: dict.faq },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="text-white p-1.5 -mr-1.5"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#191714] border-t border-white/10 px-6 py-5 flex flex-col gap-4 shadow-xl">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={`/${locale}/login`}
            onClick={() => setOpen(false)}
            className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            {dict.login}
          </Link>
        </div>
      )}
    </div>
  );
}
