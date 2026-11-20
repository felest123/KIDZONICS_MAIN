import { cn } from "@/lib/utils";

export default function LetterDisplay({ moduleId, item, special = false }) {
  const isVowel = moduleId === "vowels";

  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_14px_34px_-28px_rgba(24,60,67,0.7)] ring-1 ring-[#e6e6e2] sm:p-5">
      <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#9aa8a8]">
        {isVowel ? "Our letter today" : "Our word today"}
      </p>

      {isVowel ? (
        <>
          <div className="mt-1 flex items-baseline gap-3">
            <span
              className={cn(
                "font-display font-extrabold leading-none text-[#183c43]",
                special ? "text-[4.2rem]" : "text-[3.4rem]"
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "font-display font-extrabold leading-none text-[#159b91]",
                special ? "text-[3.2rem]" : "text-[2.5rem]"
              )}
            >
              {item.label.toLowerCase()}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span
              className={cn(
                "flex items-center justify-center rounded-2xl bg-[#fff9e8]",
                special ? "h-16 w-16 text-4xl" : "h-14 w-14 text-3xl"
              )}
            >
              {item.emoji}
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold text-[#183c43]">{item.word}</p>
              <p className="font-display text-sm font-extrabold text-[#e08a1e]">
                {item.label} says /{item.sound}/
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-1 flex items-end gap-1.5">
            {[item.onset, item.vowel, item.coda].map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                className={cn(
                  "flex items-center justify-center rounded-2xl font-display font-extrabold text-white",
                  special ? "h-16 w-14 text-3xl" : "h-14 w-12 text-2xl"
                )}
                style={{ background: [item.color, "#159b91", "#e08a1e"][index] }}
              >
                {letter}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span
              className={cn(
                "flex items-center justify-center rounded-2xl bg-[#fff9e8]",
                special ? "h-16 w-16 text-4xl" : "h-14 w-14 text-3xl"
              )}
            >
              {item.emoji}
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold text-[#183c43]">{item.word}</p>
              <p className="font-display text-sm font-extrabold text-[#e08a1e]">
                {item.onset} · {item.vowel} · {item.coda}
              </p>
            </div>
          </div>
        </>
      )}

      <p className="mt-3 rounded-xl bg-[#f6f6f2] px-3 py-2 text-xs font-bold leading-snug text-[#5b7576]">{item.tip}</p>
    </section>
  );
}
