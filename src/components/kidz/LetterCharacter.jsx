import { cn } from "@/lib/utils";

// Friendly letter character: a rounded tile with a face.
export default function LetterCharacter({ letter = "A", color = "#0d9488", size = "md", className = "" }) {
  const sizes = {
    sm: "h-16 w-16 rounded-[1.2rem] text-3xl",
    md: "h-24 w-24 rounded-[1.6rem] text-5xl",
    lg: "h-36 w-36 rounded-[2.2rem] text-7xl",
    xl: "h-48 w-48 rounded-[2.6rem] text-8xl",
  };
  const eyes = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
    xl: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center border-[3px] border-white/80 shadow-[0_12px_0_-4px_rgba(44,74,82,0.15),0_22px_36px_-20px_rgba(44,74,82,0.6)]",
        sizes[size] || sizes.md,
        className
      )}
      style={{ background: color }}
    >
      <span className="font-display font-extrabold leading-none text-white drop-shadow-[0_3px_0_rgba(44,74,82,0.25)]">
        {letter}
      </span>
      <span className={cn("absolute left-[26%] top-[24%] rounded-full bg-white", eyes[size] || eyes.md)}>
        <span className="absolute right-[18%] top-[20%] h-1/2 w-1/2 rounded-full bg-[#2c4a52]" />
      </span>
      <span className={cn("absolute right-[26%] top-[24%] rounded-full bg-white", eyes[size] || eyes.md)}>
        <span className="absolute right-[18%] top-[20%] h-1/2 w-1/2 rounded-full bg-[#2c4a52]" />
      </span>
      <svg
        className="absolute bottom-[16%] left-1/2 -translate-x-1/2"
        width="30"
        height="12"
        viewBox="0 0 30 12"
        aria-hidden="true"
      >
        <path d="M2 2a13 13 0 0 0 26 0" stroke="#2c4a52" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
