import { useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import Logo from "@/components/landing/Logo";

const LANGUAGES = ["English", "Filipino"];

export default function LandingHeader({ onAbout }) {
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState("English");

  return (
    <header className="sticky top-0 z-40 bg-[#2c4a52] shadow-[0_6px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8">
        <Logo size="md" />

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onAbout}
            className="kz-btn rounded-full bg-[#5fd4c8] px-5 py-2.5 text-sm font-extrabold text-[#0e3f47] shadow-[0_4px_0_#38a79d] transition hover:brightness-105 active:translate-y-[2px] active:shadow-none"
          >
            About
          </button>

          <div className="relative">
            <button
              onClick={() => setLangOpen((open) => !open)}
              className="kz-btn gap-1.5 rounded-full bg-[#5fd4c8] px-5 py-2.5 text-sm font-extrabold text-[#0e3f47] shadow-[0_4px_0_#38a79d] transition hover:brightness-105 active:translate-y-[2px] active:shadow-none"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              {language}
              <ChevronDown className={`h-4 w-4 transition ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-[#d6e9e9] bg-white p-1 shadow-xl">
                {LANGUAGES.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setLanguage(option);
                      setLangOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#2c4a52] hover:bg-[#eaf7f5]"
                  >
                    {option}
                    {language === option && <Star className="h-4 w-4 text-[#f97316]" />}
                  </button>
                ))}
                <p className="px-3 py-2 text-[11px] font-semibold leading-tight text-[#8aa8ac]">
                  More languages coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
