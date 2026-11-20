import { ArrowLeft, Lock, Sparkles, Star } from "lucide-react";
import { worldFor } from "@/lib/worlds";
import { starsFor } from "@/lib/progress";
import { cn } from "@/lib/utils";

const POSITIONS = {
  5: [
    { x: 12, y: 62 },
    { x: 31, y: 30 },
    { x: 50, y: 60 },
    { x: 70, y: 28 },
    { x: 88, y: 58 },
  ],
  6: [
    { x: 9, y: 64 },
    { x: 24, y: 32 },
    { x: 40, y: 62 },
    { x: 57, y: 28 },
    { x: 73, y: 60 },
    { x: 89, y: 30 },
  ],
};

function positionsFor(count) {
  return POSITIONS[count] || POSITIONS[5];
}

function pathFor(points) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    const mid = (prev.x + cur.x) / 2;
    d += ` C ${mid} ${prev.y}, ${mid} ${cur.y}, ${cur.x} ${cur.y}`;
  }
  return d;
}

export default function AdventureMap({ moduleId, title, map, onSelect, onBack, muted = false }) {
  const points = positionsFor(map.length);
  const d = pathFor(points);
  const total = map.length;
  const done = map.filter((node) => node.state === "completed").length;
  const earnedStars = (node) => node.stars ?? starsFor(node.accuracy);
  const stars = map.reduce((sum, node) => sum + (node.state === "completed" ? earnedStars(node) : 0), 0);
  const percent = Math.round((done / Math.max(total, 1)) * 100);

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-[#dff3c8]">
      <header className="z-20 shrink-0 bg-[#2c4a52] px-3 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={onBack}
            className="kz-btn gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Folders
          </button>

          <div className="flex-1">
            <p className="font-display text-sm font-extrabold uppercase tracking-wide text-[#5fd4c8]">
              {moduleId === "vowels" ? "ABC / Vowels adventure" : "CVC adventure"}
            </p>
            <p className="font-display text-lg font-extrabold leading-none text-white sm:text-xl">{title}</p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5">
            <Star className="h-4 w-4 fill-[#fcd34d] text-[#fcd34d]" />
            <span className="font-display text-sm font-extrabold text-white">{stars} stars</span>
          </div>

          <div className="order-last w-full sm:order-none sm:w-56">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-white/60">
                {done} of {total} worlds
              </span>
              <span className="text-[11px] font-extrabold text-[#fcd34d]">{percent}%</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#7cc94b] transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#a9e0f5] via-[#d7efb8] to-[#8ed85c]" />
        <div className="pointer-events-none absolute -left-10 top-[6%] text-5xl opacity-90">☁️</div>
        <div className="pointer-events-none absolute left-[36%] top-[3%] text-4xl opacity-80">☁️</div>
        <div className="pointer-events-none absolute right-[8%] top-[8%] text-6xl">☀️</div>
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-56 w-[70%] rounded-[50%] bg-[#7cc94b]" />
        <div className="pointer-events-none absolute -bottom-28 right-[-10%] h-64 w-[75%] rounded-[50%] bg-[#6fbd44]" />
        <div className="pointer-events-none absolute bottom-[6%] left-[20%] text-4xl">🌳</div>
        <div className="pointer-events-none absolute bottom-[4%] right-[24%] text-4xl">🌲</div>
        <div className="pointer-events-none absolute bottom-[10%] left-[62%] text-3xl">🌻</div>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d={d} fill="none" stroke="#c8963f" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
          <path d={d} fill="none" stroke="#f6cd6b" strokeWidth="8" strokeLinecap="round" />
          <path
            d={d}
            fill="none"
            stroke="#fff3d6"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="3 5"
          />
        </svg>

        {map.map((node, index) => {
          const point = points[index];
          const world = worldFor(moduleId, node.key);
          const locked = node.state === "locked";
          const current = node.state === "current";
          const completed = node.state === "completed";
          const earned = earnedStars(node);

          return (
            <button
              key={node.key}
              onClick={() => onSelect(node)}
              disabled={locked}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none",
                locked && "cursor-not-allowed"
              )}
              aria-label={`${world.world} — ${node.state}`}
            >
              <div className="relative flex flex-col items-center">
                {world.props.map((prop) => (
                  <span
                    key={`${node.key}-${prop.e}-${prop.dx}`}
                    className="pointer-events-none absolute"
                    style={{
                      left: `calc(50% + ${prop.dx}px)`,
                      top: `calc(50% + ${prop.dy}px)`,
                      fontSize: `${prop.size}px`,
                      lineHeight: 1,
                    }}
                  >
                    {prop.e}
                  </span>
                ))}

                {current && (
                  <span className="mb-1 flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 font-display text-[11px] font-extrabold text-[#f97316] shadow">
                    <Sparkles className="h-3 w-3" /> START HERE
                  </span>
                )}

                <div
                  className={cn(
                    "relative flex h-[74px] w-[74px] items-center justify-center rounded-full border-[5px] shadow-[0_10px_0_-4px_rgba(44,74,82,0.25),0_18px_26px_-16px_rgba(44,74,82,0.9)] transition-transform sm:h-[92px] sm:w-[92px] lg:h-[104px] lg:w-[104px]",
                    locked ? "border-[#d5dfe1] bg-[#c3cfd2]" : "border-white",
                    current && !muted && !locked && "animate-kz-glow",
                    !locked && "active:scale-95"
                  )}
                  style={!locked ? { background: world.island } : undefined}
                >
                  <span className="text-3xl sm:text-4xl lg:text-5xl">{locked ? "🔒" : world.guide}</span>

                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-wide text-white shadow"
                    style={{ background: locked ? "#94a3b8" : world.accent }}
                  >
                    {node.label}
                  </span>

                  {locked && (
                    <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#7c5fd3] text-white shadow">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex h-4 items-center gap-0.5">
                  {completed &&
                    [0, 1, 2].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3.5 w-3.5 drop-shadow",
                          star < earned ? "fill-[#f59e0b] text-[#f59e0b]" : "text-white/70"
                        )}
                      />
                    ))}
                </div>

                <span className="mt-0.5 max-w-[7.5rem] rounded-full bg-white/85 px-2 py-0.5 text-center font-display text-[10px] font-extrabold leading-tight text-[#2c4a52] shadow-sm sm:text-[11px]">
                  {world.world}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="z-20 shrink-0 bg-[#2c4a52] px-4 py-2 text-center">
        <p className="text-xs font-bold text-white/75 sm:text-sm">
          {muted
            ? "Calm mode is on — take all the time you need. 💚"
            : "Tap the glowing world to start. Finish it to unlock the next one!"}
        </p>
      </div>
    </div>
  );
}
