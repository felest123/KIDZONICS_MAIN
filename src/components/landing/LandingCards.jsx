import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Image } from "@/components/ui/image";

const MASCOT = "https://media.base44.com/images/public/6ae4490024095eb67fa4ddd9/985a6ad9f_generated_image.png";

const CARDS = [
  {
    id: "see",
    title: "WHAT YOU'LL SEE",
    category: "ABC",
    description: "Explore the alphabet, vowel sounds, and CVC words.",
    button: "See the contents",
    target: "contents",
    bg: "#FCD34D",
    ink: "#3f3410",
  },
  {
    id: "earn",
    title: "WHAT YOU'LL EARN",
    description: "Discover your achievements, rewards, and learning milestones.",
    button: "See the vision",
    target: "vision",
    bg: "#0D9488",
    ink: "#ffffff",
  },
  {
    id: "learn",
    title: "WHAT YOU'LL LEARN",
    description: "Discover the KidZonics Team Mission.",
    button: "See the mission",
    target: "mission",
    bg: "#F97316",
    ink: "#ffffff",
  },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingCards() {
  return (
    <section className="relative z-20 mx-auto -mt-12 max-w-6xl px-4 pb-14 sm:-mt-16 sm:px-8">
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {CARDS.map((card, index) => (
          <motion.article
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: index * 0.08 }}
            className="flex flex-col items-center rounded-[2rem] border-4 border-white p-5 text-center shadow-[0_14px_0_-4px_rgba(44,74,82,0.12),0_24px_40px_-24px_rgba(44,74,82,0.6)] sm:p-6"
            style={{ background: card.bg }}
          >
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow-[0_10px_20px_-14px_rgba(0,0,0,0.65)] sm:h-28 sm:w-28">
              <Image src={MASCOT} alt="Smiling letter A mascot" fittingType="fit" className="h-full w-full object-contain" />
            </div>

            <h3 className="mt-4 font-display text-xl font-extrabold tracking-wide" style={{ color: card.ink }}>
              {card.title}
            </h3>

            {card.category && (
              <span
                className="mt-1.5 rounded-full bg-white/80 px-3 py-0.5 font-display text-sm font-extrabold tracking-[0.14em]"
                style={{ color: card.bg === "#FCD34D" ? "#0d6f74" : "#2c4a52" }}
              >
                {card.category}
              </span>
            )}

            <p className="mt-2 flex-1 text-sm font-bold sm:text-base" style={{ color: card.ink === "#ffffff" ? "rgba(255,255,255,0.92)" : card.ink }}>
              {card.description}
            </p>

            <button
              onClick={() => scrollToId(card.target)}
              className="kz-btn mt-5 w-full rounded-full bg-white/95 px-4 py-3 text-sm font-extrabold text-[#2c4a52] shadow-[0_5px_0_rgba(44,74,82,0.18)] transition hover:bg-white active:translate-y-[2px] active:shadow-none"
            >
              {card.button}
              <ChevronDown className="h-4 w-4" />
            </button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
