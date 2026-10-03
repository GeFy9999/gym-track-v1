import type { Dictionary } from "@/dictionaries";

type Props = {
  dict: Dictionary["faq"];
};

export default function Faq({ dict }: Props) {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9552c] mb-3">
          {dict.eyebrow}
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-[#191714] tracking-tight">
          {dict.title}
        </h2>
      </div>

      <div className="space-y-4">
        {dict.items.map((item) => (
          <div key={item.q} className="bg-[#ece7dd] rounded-2xl p-6">
            <h3 className="font-bold text-[#191714] mb-2">{item.q}</h3>
            <p className="text-sm text-[#191714]/60 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
