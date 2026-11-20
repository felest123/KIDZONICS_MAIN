import { useState } from "react";
import { Check, X } from "lucide-react";
import { pictureChoices } from "@/lib/curriculum";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

export default function PictureMatch({ moduleId, item, special = false, onSolved }) {
  const [wrong, setWrong] = useState([]);
  const [solved, setSolved] = useState(false);
  const choices = pictureChoices(moduleId, item);

  const pick = (choice) => {
    if (solved) return;
    if (choice.key === item.key) {
      setSolved(true);
      speak(item.word, { rate: 0.72 });
      if (onSolved) onSolved();
      return;
    }
    setWrong((prev) => [...prev, choice.key]);
    speak("Try again!", { rate: 0.9 });
  };

  return (
    <div className="rounded-[2rem] border-4 border-white bg-white p-4 shadow-[0_18px_36px_-26px_rgba(44,74,82,0.8)] sm:p-6">
      <p className="text-center font-display text-xl font-extrabold text-[#2c4a52] sm:text-2xl">
        {moduleId === "vowels" ? `Which picture starts with ${item.label}?` : `Which picture is ${item.word}?`}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {choices.map((choice) => {
          const isWrong = wrong.includes(choice.key);
          const isRight = solved && choice.key === item.key;
          return (
            <button
              key={choice.key}
              onClick={() => pick(choice)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-2xl border-4 bg-white px-2 py-4 transition active:translate-y-[2px]",
                isRight ? "border-[#22c55e] bg-[#ecfdf3]" : "border-[#e2eef0]",
                isWrong && "border-[#fca5a5] opacity-70"
              )}
            >
              <span className={cn(special ? "text-6xl" : "text-5xl")}>{choice.emoji}</span>
              <span className="font-display text-[11px] font-extrabold uppercase text-[#6b8a90] sm:text-xs">
                {choice.word}
              </span>
              {isRight && (
                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#22c55e] text-white">
                  <Check className="h-4 w-4" />
                </span>
              )}
              {isWrong && (
                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#ef4444] text-white">
                  <X className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm font-bold text-[#6b8a90]">
        {solved ? "Yes! That is correct. 🎉" : "Tap the picture that matches."}
      </p>
    </div>
  );
}
