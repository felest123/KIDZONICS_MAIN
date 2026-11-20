import { cn } from "@/lib/utils";

function Cloud({ className = "", delay = "0s" }) {
  return (
    <div className={cn("pointer-events-none absolute animate-kz-float", className)} style={{ animationDelay: delay }}>
      <div className="relative h-9 w-24 sm:h-12 sm:w-32">
        <span className="absolute bottom-0 left-0 h-7 w-7 rounded-full bg-white sm:h-9 sm:w-9" />
        <span className="absolute bottom-0 left-6 h-11 w-11 rounded-full bg-white sm:h-14 sm:w-14" />
        <span className="absolute bottom-0 right-1 h-7 w-9 rounded-full bg-white sm:h-9 sm:w-12" />
        <span className="absolute bottom-0 left-0 h-5 w-24 rounded-full bg-white sm:h-7 sm:w-32" />
      </div>
    </div>
  );
}

export function Grass({ className = "", tall = false }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden", className)} aria-hidden="true">
      <div className={cn("relative w-full", tall ? "h-24 sm:h-32" : "h-14 sm:h-20")}>
        <div className="absolute -bottom-24 left-[-15%] h-40 w-[70%] rounded-[50%] bg-[#63b93f]" />
        <div className="absolute -bottom-28 right-[-15%] h-44 w-[75%] rounded-[50%] bg-[#7cc94b]" />
        <div className="absolute -bottom-24 left-[20%] h-36 w-[60%] rounded-[50%] bg-[#8ed85c]" />
        <div className="absolute bottom-2 left-[8%] h-4 w-1.5 rounded-full bg-[#5aa838]" />
        <div className="absolute bottom-1 left-[12%] h-6 w-1.5 rotate-6 rounded-full bg-[#5aa838]" />
        <div className="absolute bottom-2 right-[16%] h-5 w-1.5 -rotate-6 rounded-full bg-[#5aa838]" />
        <div className="absolute bottom-1 right-[11%] h-4 w-1.5 rounded-full bg-[#5aa838]" />
      </div>
    </div>
  );
}

export default function SkyScene({ children, className = "", grassTall = false }) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-gradient-to-b from-[#8fd6f3] via-[#bde9fa] to-[#e4f7fe]",
        className
      )}
    >
      <Cloud className="left-[6%] top-8" />
      <Cloud className="right-[8%] top-16 sm:top-10" delay="1.2s" />
      <Cloud className="left-[42%] top-4 scale-75 opacity-90" delay="2.1s" />
      <Cloud className="right-[30%] top-32 scale-90 opacity-80" delay="0.6s" />
      <div className="relative z-10">{children}</div>
      <Grass tall={grassTall} />
    </section>
  );
}
