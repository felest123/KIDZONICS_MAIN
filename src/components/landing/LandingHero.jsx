import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SkyScene from "@/components/kidz/SkyScene";
import Logo from "@/components/landing/Logo";

export default function LandingHero({ onStart }) {
  return (
    <SkyScene grassTall>
      <div className="relative mx-auto max-w-4xl px-5 pb-32 pt-8 text-center sm:pb-44 sm:pt-10">
        <div className="pointer-events-none absolute left-1/2 top-2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-white/50 blur-3xl sm:h-80 sm:w-80" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Logo size="lg" tone="dark" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 130, damping: 16 }}
          className="mt-5 font-display text-[2.6rem] font-extrabold leading-[0.95] tracking-tight text-[#0e5f68] drop-shadow-[0_3px_0_rgba(255,255,255,0.75)] sm:text-6xl"
        >
          WELCOME TO
          <span className="mt-1 block text-[#f97316] drop-shadow-[0_4px_0_rgba(255,255,255,0.85)]">KIDZONICS</span>
        </motion.h1>

        <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-2 sm:gap-3">
          {["Read It!", "Say It!", "Learn It!"].map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1 }}
              className="rounded-full bg-white/90 px-4 py-1.5 font-display text-base font-bold text-[#2c4a52] shadow-sm sm:text-xl"
            >
              {word}
            </motion.span>
          ))}
        </div>

        <div className="mt-9 flex flex-col items-center gap-4">
          <button
            onClick={onStart}
            className="kz-btn group relative rounded-full bg-[#0d9488] px-10 py-5 text-xl font-extrabold tracking-wide text-white shadow-[0_10px_0_#0a6f66,0_24px_40px_-18px_rgba(13,148,136,0.9)] transition hover:brightness-105 active:translate-y-[4px] active:shadow-[0_5px_0_#0a6f66] sm:px-14 sm:text-2xl"
          >
            GET STARTED
            <ArrowRight className="h-6 w-6 transition group-hover:translate-x-1" />
          </button>
          <p className="text-sm font-bold text-[#2f6b76]">Tap once to start learning</p>
        </div>
      </div>
    </SkyScene>
  );
}
