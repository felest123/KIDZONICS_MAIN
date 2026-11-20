import { Volume2 } from "lucide-react";
import PronunciationCheck from "@/components/lesson/PronunciationCheck";
import { cn } from "@/lib/utils";

const TOTAL = 3;

function praiseFor(pending) {
  if (pending.passed) {
    return pending.trial === 1 ? "Excellent! You got it!" : "Great job! Let's continue!";
  }
  if (pending.trial === 1) return "Almost there! Listen again!";
  if (pending.trial === 2) return "Let's try one more time!";
  return "You did your best!";
}

export default function PracticeTrial({
  moduleId,
  item,
  target,
  trial,
  attempts = [],
  pending,
  special = false,
  onResult,
  onContinue,
  onReplay,
}) {
  const isVowel = moduleId === "vowels";
  const label = isVowel ? `Say the letter "${item.label}"!` : `Say the word "${item.word}"!`;

  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_14px_34px_-28px_rgba(24,60,67,0.7)] ring-1 ring-[#e6e6e2]">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-[#e6f6f4] px-3 py-1 font-display text-[11px] font-extrabold uppercase tracking-wide text-[#0f7d75]">
          Trial {trial} / {TOTAL}
        </span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={cn(
                "h-2.5 rounded-full transition-all",
                step < trial || (step === trial && pending)
                  ? "w-7 bg-[#159b91]"
                  : step === trial
                    ? "w-7 bg-[#f5d34a]"
                    : "w-2.5 bg-[#e3e6e4]"
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-2.5 text-center">
        <p className={cn("font-display font-extrabold leading-tight text-[#183c43]", special ? "text-2xl" : "text-xl")}>
          {label}
        </p>
        <p className="text-xs font-bold text-[#7d9495]">
          {isVowel ? `${item.label} says /${item.sound}/` : `${item.onset} · ${item.vowel} · ${item.coda}`}
        </p>
      </div>

      {!pending ? (
        <>
          <div className="mt-2">
            <PronunciationCheck target={target} big={special} onResult={onResult} label="Tap the mic, then say it" />
          </div>
          <button
            onClick={onReplay}
            className="kz-btn mx-auto mt-2 flex gap-1.5 rounded-full bg-[#f5d34a] px-4 py-2 text-xs text-[#183c43] shadow-[0_4px_0_#d9b731] active:translate-y-[2px] active:shadow-none"
          >
            <Volume2 className="h-4 w-4" /> Listen again
          </button>
        </>
      ) : (
        <div className="mt-2 rounded-[1.4rem] bg-[#f4fbfa] p-3 text-center">
          <p className={cn("font-display text-lg font-extrabold leading-tight", pending.passed ? "text-[#0f7d75]" : "text-[#c2761a]")}>
            {praiseFor(pending)}
          </p>
          {pending.feedback && <p className="mt-1 text-xs font-bold text-[#6b8a90]">{pending.feedback}</p>}
          <span className="mt-2 inline-block rounded-full bg-[#e6f6f4] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#0f7d75]">
            Assessment complete
          </span>
          <button
            onClick={onContinue}
            className="kz-btn mt-3 w-full rounded-full bg-[#159b91] px-5 py-3 text-sm text-white shadow-[0_5px_0_#0f7d75] active:translate-y-[3px] active:shadow-none"
          >
            {pending.passed ? "Continue" : pending.trial >= TOTAL ? "See my stars" : "Try again"}
          </button>
        </div>
      )}

      {attempts.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
          {attempts.map((attempt) => (
            <span
              key={attempt.trial}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                attempt.passed ? "bg-[#e6f7ee] text-[#15803d]" : "bg-[#fff4e5] text-[#b05e00]"
              )}
            >
              {attempt.passed ? "⭐" : "🔁"} Try {attempt.trial}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
