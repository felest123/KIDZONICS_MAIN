import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { moduleItems } from "@/lib/curriculum";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

function takeRandom(list, count) {
  const pool = [...list];
  const picked = [];
  while (picked.length < count && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

export default function IceBreaker({ moduleId, world, muted = false, onComplete }) {
  const rounds = useMemo(() => takeRandom(moduleItems(moduleId), 3), [moduleId]);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [done, setDone] = useState(false);
  const [locked, setLocked] = useState(false);

  const round = rounds[index];
  const options = useMemo(() => {
    if (!round) return [];
    const others = takeRandom(
      moduleItems(moduleId).filter((item) => item.key !== round.key),
      muted ? 1 : 3
    );
    return [round, ...others].sort(() => Math.random() - 0.5);
  }, [round, moduleId, muted]);

  useEffect(() => {
    if (!round || done) return;
    setWrong([]);
    const instruction =
      moduleId === "vowels"
        ? `Warm up time! Tap the picture that starts with ${round.label}.`
        : `Warm up time! Tap the picture for ${round.word}.`;
    const timer = setTimeout(() => speak(instruction, { rate: 0.85 }), 400);
    return () => clearTimeout(timer);
  }, [round, moduleId, done]);

  useEffect(() => {
    if (!done) return;
    speak("Great job! Let's start your adventure!", { rate: 0.9 });
    const timer = setTimeout(() => onComplete(), 2600);
    return () => clearTimeout(timer);
  }, [done, onComplete]);

  if (!round) return null;

  const pick = (choice) => {
    if (locked) return;
    if (choice.key === round.key) {
      speak("Yes! Great job!", { rate: 0.95 });
      if (index + 1 >= rounds.length) {
        setDone(true);
        return;
      }
      setLocked(true);
      setTimeout(() => {
        setIndex((value) => value + 1);
        setLocked(false);
      }, 850);
      return;
    }
    setWrong((prev) => [...prev, choice.key]);
    speak("Almost! Try again.", { rate: 0.9 });
  };

  const accent = world?.accent || "#0d9488";
  const instruction =
    moduleId === "vowels"
      ? `Tap the picture that starts with "${round.label}"`
      : `Tap the picture for "${round.word}"`;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex flex-col overflow-y-auto",
        muted ? "bg-[#f3f8f5]" : "bg-gradient-to-b from-[#bde9fa] via-[#e6f7fe] to-[#e9f8d8]"
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-white text-2xl shadow">
            {world?.guide || "🦁"}
          </span>
          <div>
            <p className="font-display text-lg font-extrabold leading-none text-[#2c4a52] sm:text-xl">
              Warm-up game
            </p>
            <p className="text-xs font-bold text-[#5b7f86]">{world?.guideName || "Your guide"} says hello!</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {rounds.map((item, step) => (
            <span
              key={item.key}
              className={cn(
                "h-3 rounded-full transition-all",
                step < index || done ? "w-8 bg-[#22c55e]" : step === index ? "w-8" : "w-3 bg-white"
              )}
              style={step === index && !done ? { background: accent } : undefined}
            />
          ))}
        </div>
      </header>

      {done ? (
        <motion.div
          initial={{ opacity: 0, scale: muted ? 1 : 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: muted ? 0.5 : 0.35 }}
          className="flex flex-1 flex-col items-center justify-center px-5 pb-10 text-center"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-white bg-white text-6xl shadow-lg">
            {world?.guide || "🦁"}
          </div>
          <div className="mt-4 flex gap-1">
            {[0, 1, 2].map((star) => (
              <Star key={star} className="h-10 w-10 fill-[#f59e0b] text-[#f59e0b]" />
            ))}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-[#2c4a52] sm:text-4xl">
            Great job!
          </h1>
          <p className="mt-1 font-display text-xl font-extrabold text-[#0d6f74] sm:text-2xl">
            Let's start your adventure!
          </p>
          <button
            onClick={onComplete}
            className="kz-btn mt-6 rounded-full px-8 py-4 text-lg text-white shadow-[0_8px_0_rgba(0,0,0,0.18)] active:translate-y-[3px] active:shadow-none"
            style={{ background: accent }}
          >
            Open my map <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      ) : (
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 pb-10">
          <div className="mt-2 flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 shadow-sm">
            <span className="text-2xl">{world?.guide || "🦁"}</span>
            <p className="font-display text-base font-extrabold text-[#2c4a52] sm:text-lg">{instruction}</p>
          </div>

          <div
            className={cn(
              "mt-5 grid w-full gap-3",
              options.length > 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"
            )}
          >
            {options.map((choice) => {
              const isWrong = wrong.includes(choice.key);
              return (
                <button
                  key={choice.key}
                  onClick={() => pick(choice)}
                  disabled={locked}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-[1.8rem] border-4 bg-white px-3 py-5 shadow-[0_10px_0_-4px_rgba(44,74,82,0.12)] transition active:translate-y-[2px]",
                    muted ? "" : "hover:-translate-y-1",
                    isWrong ? "border-[#fca5a5] opacity-60" : "border-white"
                  )}
                >
                  <span className={muted ? "text-6xl" : "text-5xl sm:text-6xl"}>{choice.emoji}</span>
                  <span className="font-display text-sm font-extrabold uppercase tracking-wide text-[#6b8a90]">
                    {choice.word}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-center text-sm font-bold text-[#5b7f86]">
            {muted ? "Take your time. Tap the picture when you are ready." : "Tap the picture that matches. You can try again!"}
          </p>
        </main>
      )}
    </div>
  );
}
