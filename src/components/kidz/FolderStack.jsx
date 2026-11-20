import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play, Star } from "lucide-react";
import { moduleItems } from "@/lib/curriculum";
import { worldFor } from "@/lib/worlds";
import { cn } from "@/lib/utils";

export const FOLDERS = [
  {
    id: "vowels",
    module: "vowels",
    title: "ABC / VOWELS",
    subtitle: "Ant, Elephant, Iguana, Owl, Unicorn",
    tab: "#e0b324",
    body: "#fcd34d",
    ink: "#3f3410",
    icon: "🔤",
    soon: false,
  },
  {
    id: "cvc",
    module: "cvc",
    title: "CVC WORDS",
    subtitle: "Cat · Bat · Hen · Pin · Dog · Sun",
    tab: "#0a6f66",
    body: "#14b8a6",
    ink: "#ffffff",
    icon: "📚",
    soon: false,
  },
  {
    id: "soon1",
    module: null,
    title: "COMING SOON",
    subtitle: "Sight words",
    tab: "#d15c09",
    body: "#f97316",
    ink: "#ffffff",
    icon: "🚧",
    soon: true,
  },
  {
    id: "soon2",
    module: null,
    title: "COMING SOON",
    subtitle: "Rhyming games",
    tab: "#4aa8c9",
    body: "#7dd3e8",
    ink: "#12333b",
    icon: "🎈",
    soon: true,
  },
];

const TILT = [-1.6, 1.2, -0.9, 1.5];

export default function FolderStack({
  activeId,
  onSelect,
  onBack,
  onStart,
  progressByModule = {},
  muted = false,
  special = false,
}) {
  const anyActive = Boolean(activeId);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {FOLDERS.map((folder, index) => {
        const isActive = activeId === folder.id;
        const dimmed = anyActive && !isActive;
        const body = muted && !folder.soon ? "#dcece6" : folder.body;
        const ink = muted && !folder.soon ? "#2c4a52" : folder.ink;
        const done = progressByModule[folder.id] ?? 0;
        const total = folder.module ? moduleItems(folder.module).length : 0;
        const worlds = folder.module ? moduleItems(folder.module) : [];

        return (
          <motion.div
            key={folder.id}
            animate={{
              height: isActive ? 424 : dimmed ? 56 : 116,
              scale: isActive ? 1 : dimmed ? 0.965 : 1,
            }}
            transition={{ duration: special ? 0.6 : 0.35, ease: "easeInOut" }}
            style={{
              zIndex: isActive ? 50 : 20 - index,
              marginTop: index === 0 ? 0 : -18,
              rotate: isActive || dimmed ? 0 : TILT[index],
            }}
            onClick={() => {
              if (!isActive) onSelect(folder);
            }}
            className={cn(
              "kz-paper relative overflow-hidden rounded-[1.7rem] border-4 border-white transition-shadow",
              isActive
                ? "shadow-[0_18px_0_-6px_rgba(44,74,82,0.14),0_30px_50px_-24px_rgba(44,74,82,0.8)]"
                : "cursor-pointer shadow-[0_10px_0_-4px_rgba(44,74,82,0.12),0_18px_28px_-20px_rgba(44,74,82,0.7)]"
            )}
            aria-label={`${folder.title} folder`}
          >
            <span
              className="absolute left-0 top-0 flex h-9 items-center rounded-br-[1.2rem] px-4 font-display text-[11px] font-extrabold uppercase tracking-[0.14em] shadow-sm"
              style={{ background: folder.tab, color: ink }}
            >
              {folder.title}
            </span>

            <div className="flex h-full flex-col px-4 pb-4 pt-10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("shrink-0", isActive ? "text-3xl" : "text-2xl")}>{folder.icon}</span>
                  <div>
                    <p className="font-display text-base font-extrabold leading-tight sm:text-lg" style={{ color: ink }}>
                      {folder.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {folder.soon ? (
                    <span
                      className="rounded-full bg-black/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                      style={{ color: ink }}
                    >
                      Soon
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 font-display text-[11px] font-extrabold"
                      style={{ color: "#2c4a52" }}
                    >
                      <Star className="h-3 w-3 fill-[#f59e0b] text-[#f59e0b]" /> {done}/{total}
                    </span>
                  )}
                  {!isActive && <ArrowRight className="h-4 w-4" style={{ color: ink }} />}
                </div>
              </div>

              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.3 }}
                  className="mt-3 flex flex-1 flex-col overflow-hidden"
                >
                  {folder.soon ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
                      <span className="text-4xl">🚀</span>
                      <p className="font-display text-xl font-extrabold" style={{ color: ink }}>
                        Coming soon!
                      </p>
                      <p className="max-w-xs text-xs font-bold opacity-80" style={{ color: ink }}>
                        This folder is still being built. Keep practising your vowels and CVC words!
                      </p>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onBack();
                        }}
                        className="kz-btn mt-2 gap-2 rounded-full bg-white/80 px-5 py-2.5 text-xs text-[#2c4a52]"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back to folders
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {worlds.map((item) => {
                          const world = worldFor(folder.module, item.key);
                          return (
                            <span
                              key={item.key}
                              className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-extrabold text-[#2c4a52]"
                            >
                              <span className="text-sm">{world.guide}</span>
                              {world.world.replace(" World", "")}
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-2.5 rounded-2xl bg-white/70 px-3 py-2">
                        <p className="text-[11px] font-bold leading-snug text-[#4d6f75] sm:text-xs">
                          {special
                            ? "Calm mode: one activity at a time, extra-large buttons and no timers."
                            : "A short warm-up game comes first, then your full-screen adventure map!"}
                        </p>
                      </div>

                      <div className="mt-auto pt-3">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onStart(folder);
                          }}
                          className="kz-btn w-full gap-2 rounded-full bg-[#2c4a52] px-5 py-3.5 text-base text-white shadow-[0_6px_0_rgba(0,0,0,0.25)] active:translate-y-[3px] active:shadow-none"
                        >
                          <Play className="h-5 w-5" /> Start adventure
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onBack();
                          }}
                          className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-white/60 px-4 py-2 text-[11px] font-extrabold text-[#2c4a52]"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Back to folders
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
