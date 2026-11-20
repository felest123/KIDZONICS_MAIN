import { useState } from "react";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

export default function AudioLesson({ moduleId, item, special = false }) {
  const [plays, setPlays] = useState(0);
  const isVowel = moduleId === "vowels";

  const demo = isVowel
    ? `${item.label}. ${item.label} says ${item.sound}. ${item.say}`
    : `${item.onset}, ${item.vowel}, ${item.coda}. ${item.word}. ${item.say}`;

  const play = () => {
    setPlays((value) => value + 1);
    speak(demo, { rate: special ? 0.6 : 0.78 });
  };

  return (
    <section className="flex items-center gap-3.5 rounded-[1.75rem] bg-[#fff9e8] p-3.5 ring-1 ring-[#f2e7c4]">
      <button
        onClick={play}
        className={cn(
          "kz-btn shrink-0 rounded-full bg-[#159b91] text-white shadow-[0_7px_0_#0f7d75] active:translate-y-[3px] active:shadow-none",
          special ? "h-20 w-20" : "h-16 w-16"
        )}
        aria-label="Play the sound"
      >
        <Volume2 className={special ? "h-9 w-9" : "h-8 w-8"} />
      </button>

      <div className="min-w-0 text-left">
        <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#b08b2c]">Listen to the sound</p>
        <p className="truncate font-display text-lg font-extrabold text-[#183c43]">
          {isVowel ? `${item.label} says /${item.sound}/` : `${item.word} — ${item.onset} ${item.vowel} ${item.coda}`}
        </p>
        <p className="text-[11px] font-bold text-[#9c8a55]">
          {plays === 0 ? "Tap to hear it" : "Tap again to replay — as many times as you like"}
        </p>
      </div>
    </section>
  );
}
