import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

// Official KidZonics logo artwork. Drop the uploaded logo URL here to swap the
// wordmark for the exact artwork everywhere (header, hero, footer).
const LOGO_URL = "";

const SIZES = {
  sm: { text: "text-xl", paw: "h-4 w-4" },
  md: { text: "text-2xl sm:text-3xl", paw: "h-5 w-5 sm:h-6 sm:w-6" },
  lg: { text: "text-4xl sm:text-5xl", paw: "h-7 w-7 sm:h-9 sm:w-9" },
};

export default function Logo({ size = "md", tone = "light", className = "" }) {
  const scale = SIZES[size] || SIZES.md;

  if (LOGO_URL) {
    return (
      <img
        src={LOGO_URL}
        alt="KidZonics"
        className={cn("w-auto object-contain drop-shadow-[0_2px_6px_rgba(20,60,70,0.22)]", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 drop-shadow-[0_2px_5px_rgba(20,60,70,0.22)]", className)}>
      <span
        className={cn(
          "font-display font-extrabold leading-none tracking-tight",
          scale.text,
          tone === "dark" ? "text-[#0e5f68]" : "text-[#5fd4c8]"
        )}
      >
        KidZonics
      </span>
      <PawPrint
        className={cn("rotate-12", scale.paw, tone === "dark" ? "text-[#f97316]" : "text-[#fcd34d]")}
        strokeWidth={2.5}
      />
    </span>
  );
}
