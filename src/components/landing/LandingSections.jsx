import { motion } from "framer-motion";
import { BookOpen, Star, Sparkles, Heart, Mic, CaseSensitive, Blocks } from "lucide-react";
import { VOWELS, CVC_WORDS } from "@/lib/curriculum";

function SectionHeading({ icon: Icon, eyebrow, title, intro, accent }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: accent }}>
        <Icon className="h-6 w-6 text-white" />
      </span>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: accent }}>
          {eyebrow}
        </p>
        <h2 className="font-display text-3xl font-extrabold text-[#2c4a52] sm:text-4xl">{title}</h2>
        {intro && <p className="mt-1 text-sm font-semibold text-[#6b8a90] sm:text-base">{intro}</p>}
      </div>
    </div>
  );
}

const SEE_TILES = [
  { icon: CaseSensitive, title: "Alphabet recognition", text: "Meet every letter and the sound it makes." },
  { icon: BookOpen, title: "Vowel lessons", text: "A, E, I, O, U — one friendly world at a time." },
  { icon: Blocks, title: "CVC word reading", text: "Blend three sounds into cat, bat, hen and more." },
  { icon: Mic, title: "Pronunciation practice", text: "Listen, say it out loud, and get a cheerful reply." },
];

export function SeeSection() {
  return (
    <section id="contents" className="scroll-mt-24 bg-white px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          icon={BookOpen}
          eyebrow="What You'll See"
          title="Learning contents"
          intro="Two playful phonics folders, plus a friendly voice that listens to you."
          accent="#0d9488"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SEE_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <div key={tile.title} className="flex items-start gap-3 rounded-[1.6rem] border-2 border-[#e6f3f2] bg-[#fbfffe] p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f6]">
                  <Icon className="h-5 w-5 text-[#0d9488]" />
                </span>
                <div>
                  <p className="font-display text-lg font-extrabold text-[#2c4a52]">{tile.title}</p>
                  <p className="text-sm font-semibold text-[#6b8a90]">{tile.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-[2rem] border-4 border-[#fcd34d] bg-[#fffaf0] p-6">
            <p className="font-display text-2xl font-extrabold text-[#2c4a52]">Vowel Alphabet</p>
            <p className="mt-1 text-sm font-semibold text-[#6b8a90]">Hear it, say it, and see your star appear on the map.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {VOWELS.map((vowel) => (
                <span
                  key={vowel.key}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white font-display text-2xl font-extrabold text-white shadow-sm"
                  style={{ background: vowel.color }}
                >
                  {vowel.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border-4 border-[#0d9488] bg-[#f2fbfa] p-6">
            <p className="font-display text-2xl font-extrabold text-[#2c4a52]">CVC Words</p>
            <p className="mt-1 text-sm font-semibold text-[#6b8a90]">Blend three sounds into a real word.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CVC_WORDS.map((word) => (
                <span
                  key={word.key}
                  className="rounded-2xl bg-white px-3 py-2 font-display text-sm font-extrabold text-[#0d6f74] shadow-sm"
                >
                  {word.emoji} {word.word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EarnSection() {
  return (
    <section id="vision" className="scroll-mt-24 bg-[#e8f7f6] px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          icon={Heart}
          eyebrow="What You'll Earn"
          title="KidZonics Team Vision"
          intro="Every kindergarten learner reads with confidence — one proud “I can read it!” at a time."
          accent="#0d9488"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { emoji: "⭐", title: "Stars", text: "Collect a star each time you say a sound all by yourself." },
            { emoji: "🏅", title: "Badges", text: "Finish a world and earn a bright badge for your map." },
            { emoji: "🎉", title: "Cheer", text: "Your friendly guide claps and cheers for every good try." },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.8rem] border-4 border-white bg-white/85 p-5 text-center shadow-sm">
              <span className="text-4xl">{item.emoji}</span>
              <p className="mt-2 font-display text-xl font-extrabold text-[#2c4a52]">{item.title}</p>
              <p className="mt-1 text-sm font-semibold text-[#5b7f86]">{item.text}</p>
            </div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          className="mt-6 rounded-[1.8rem] bg-[#0d9488] px-6 py-5 text-center font-display text-lg font-extrabold text-white sm:text-xl"
        >
          “I can hear it, I can say it, and I can read it!”
        </motion.p>
      </div>
    </section>
  );
}

export function LearnSection() {
  return (
    <section id="mission" className="scroll-mt-24 bg-[#fff6ec] px-4 py-14 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          icon={Sparkles}
          eyebrow="What You'll Learn"
          title="KidZonics Team Mission"
          intro="Playful phonics with a friendly listening guide, at every child's own pace."
          accent="#f97316"
        />

        <div className="mt-8 rounded-[2rem] border-4 border-white bg-white/85 p-6 shadow-sm sm:p-8">
          <p className="text-base font-semibold leading-relaxed text-[#4d6f75] sm:text-lg">
            KidZonics blends playful phonics with friendly AI listening, so every child can hear a sound, say it
            back, and watch their star grow. Children explore vowel worlds A, E, I, O, U and blend CVC words like cat,
            bat and sun, practicing out loud with gentle, encouraging feedback along the way.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              "Letter sounds and vowel recognition",
              "Blending CVC words aloud",
              "Confident, cheerful speaking practice",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 rounded-xl bg-[#fff6ec] px-3 py-2.5">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-[#f97316]" />
                <span className="text-sm font-bold text-[#4d6f75]">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
