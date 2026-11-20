import { useState } from "react";
import { Volume2, Play, Music4, Eye } from "lucide-react";
import LetterCharacter from "@/components/kidz/LetterCharacter";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

export default function LetterBoard({ moduleId, item, special = false }) {
  const [demoOn, setDemoOn] = useState(false);
  const isVowel = moduleId === "vowels";

  const playWord = () => speak(isVowel ? item.word : item.word, { rate: 0.75 });

  const playSound = () => {
    if (isVowel) speak(`${item.sound}. ${item.sound}. ${item.word}.`, { rate: 0.7 });
    else speak(`${item.onset}. ${item.vowel}. ${item.coda}. ${item.word}.`, { rate: 0.65 });
  };

  const startDemo = () => {
    setDemoOn(true);
    playSound();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border-4 border-white bg-white p-5 text-center shadow-[0_18px_36px_-26px_rgba(44,74,82,0.8)] sm:p-7">
        {isVowel ? (
          <div className="flex flex-col items-center gap-3">
            <LetterCharacter
              letter={item.label}
              color={item.color}
              size={special ? "xl" : "lg"}
              className={special ? "" : "animate-kz-bob"}
            />
            <p className="font-display text-xl font-extrabold text-[#2c4a52] sm:text-2xl">
              {item.emoji} {item.word}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-end justify-center gap-1.5">
              {[item.onset, item.vowel, item.coda].map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className={cn(
                    "flex items-center justify-center rounded-2xl border-[3px] border-white font-display font-extrabold text-white shadow-[0_6px_0_rgba(44,74,82,0.15)]",
                    special ? "h-20 w-16 text-4xl" : "h-16 w-14 text-3xl"
                  )}
                  style={{ background: [item.color, "#0d9488", "#f97316"][index] }}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="font-display text-3xl font-extrabold text-[#2c4a52] sm:text-4xl">{item.word}</p>
            <p className="text-4xl">{item.emoji}</p>
          </div>
        )}

        <p className="mt-3 text-sm font-bold text-[#6b8a90] sm:text-base">{item.tip}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={isVowel ? () => speak(`${item.letterName}!`, { rate: 0.7 }) : playWord}
            className="kz-btn rounded-2xl bg-[#0d9488] px-4 py-4 text-base text-white shadow-[0_6px_0_#0a6f66] active:translate-y-[3px] active:shadow-none"
          >
            <Volume2 className="h-5 w-5" /> {isVowel ? `Hear "${item.label}"` : "Hear the word"}
          </button>
          <button
            onClick={playSound}
            className="kz-btn rounded-2xl bg-[#fcd34d] px-4 py-4 text-base text-[#2c4a52] shadow-[0_6px_0_#e0b324] active:translate-y-[3px] active:shadow-none"
          >
            <Music4 className="h-5 w-5" /> Sound it out
          </button>
        </div>
      </div>

      <div className="rounded-[2rem] border-4 border-white bg-[#fdf8ec] p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[#0d6f74]">
          <Eye className="h-4 w-4" />
          <p className="font-display text-sm font-extrabold uppercase tracking-wide">Watch the demonstration</p>
        </div>
        <div
          className={cn(
            "mt-3 flex flex-col items-center gap-2 rounded-[1.4rem] bg-white px-4 py-8 transition",
            demoOn && !special ? "animate-kz-fade-up" : ""
          )}
        >
          <div className="flex h-20 items-center gap-2">
            {[0, 1, 2].map((bar) => (
              <span
                key={bar}
                className={cn("w-2 rounded-full bg-[#0d9488]", demoOn && "animate-kz-bob")}
                style={{ height: `${24 + bar * 18}px`, animationDelay: `${bar * 0.15}s` }}
              />
            ))}
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#0d9488] font-display text-2xl font-extrabold text-[#0d9488]"
            >
              {isVowel ? item.label : item.word.slice(0, 1)}
            </span>
            {[2, 1, 0].map((bar) => (
              <span
                key={`r-${bar}`}
                className={cn("w-2 rounded-full bg-[#f97316]", demoOn && "animate-kz-bob")}
                style={{ height: `${24 + bar * 18}px`, animationDelay: `${bar * 0.15 + 0.1}s` }}
              />
            ))}
          </div>
          <p className="text-center font-display text-lg font-extrabold text-[#2c4a52]">{item.say}</p>
          <button
            onClick={startDemo}
            className="kz-btn gap-2 rounded-full bg-[#2c4a52] px-5 py-3 text-sm text-white"
          >
            <Play className="h-4 w-4" /> {demoOn ? "Play again" : "Play demonstration"}
          </button>
        </div>
      </div>
    </div>
  );
}
