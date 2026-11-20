import { Home, RotateCcw, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MESSAGES = {
  3: "Amazing! You got it on the first try!",
  2: "Great job! You got it!",
  1: "Good try! You did it!",
  0: "You did your best! Let's practise again.",
};

export default function LessonResult({ moduleId, item, stars = 0, attempts = 0, special = false, onRetry, onMap }) {
  return (
    <div className="mx-auto max-w-2xl px-3 pb-16 pt-6 sm:px-6">
      <div className="rounded-[2rem] border-4 border-white bg-white p-6 text-center shadow-[0_18px_36px_-26px_rgba(44,74,82,0.9)] sm:p-8">
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((index) => (
            <Star
              key={index}
              className={cn(
                "transition",
                special ? "h-14 w-14" : "h-12 w-12",
                index < stars ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#e2eef0]"
              )}
            />
          ))}
        </div>

        <p className="mt-2 font-display text-2xl font-extrabold leading-tight text-[#2c4a52] sm:text-3xl">
          {MESSAGES[stars] || MESSAGES[0]}
        </p>

        <p className="mt-1 text-sm font-bold text-[#6b8a90]">
          {moduleId === "vowels" ? `Letter ${item.label} · ${item.word}` : `${item.word}`} · you tried {attempts}{" "}
          {attempts === 1 ? "time" : "times"}
        </p>

        <p className="mt-4 rounded-2xl bg-[#fff9e8] px-4 py-3 text-sm font-bold text-[#8a6a12]">
          <Sparkles className="mr-1 inline h-4 w-4" />
          {stars > 0
            ? "Your voice was clear. Your stars are on your map!"
            : "Listen to the sound once more, then say it slowly. You can try again anytime."}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            onClick={onMap}
            className="kz-btn rounded-full bg-[#0d9488] px-6 py-4 text-base text-white shadow-[0_6px_0_#0a6f66] active:translate-y-[3px] active:shadow-none"
          >
            <Home className="h-5 w-5" /> Back to my map
          </button>
          <button
            onClick={onRetry}
            className="kz-btn rounded-full bg-[#fcd34d] px-6 py-4 text-base text-[#2c4a52] shadow-[0_6px_0_#e0b324] active:translate-y-[3px] active:shadow-none"
          >
            <RotateCcw className="h-5 w-5" /> Try this lesson again
          </button>
        </div>
      </div>
    </div>
  );
}
