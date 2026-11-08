import type { ReactNode } from "react";

type Props = {
  // Width / height of the visible screen area.
  aspectRatio: string;
  children: ReactNode;
};

// The dark phone frame shared by the app videos and screenshots on the site.
export default function PhoneFrame({ aspectRatio, children }: Props) {
  return (
    <div className="relative mx-auto w-full max-w-[250px] sm:max-w-[300px]">
      <div className="relative rounded-[2.75rem] border-[10px] border-[#191714] bg-[#191714] shadow-2xl">
        {/* Side buttons */}
        <span className="absolute -left-[13px] top-24 w-[3px] h-10 rounded-l bg-[#191714]" />
        <span className="absolute -left-[13px] top-36 w-[3px] h-14 rounded-l bg-[#191714]" />
        <span className="absolute -right-[13px] top-32 w-[3px] h-16 rounded-r bg-[#191714]" />

        <div
          className="relative overflow-hidden rounded-[2.1rem] bg-[#faf6f1]"
          style={{ aspectRatio }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
