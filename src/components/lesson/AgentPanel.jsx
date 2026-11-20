import { useState } from "react";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

export default function AgentPanel({ world, instruction, special = false }) {
  const [speaking, setSpeaking] = useState(false);

  const readAloud = () => {
    setSpeaking(true);
    speak(instruction, { rate: special ? 0.6 : 0.85, onEnd: () => setSpeaking(false) });
  };

  return (
    <section className="rounded-[1.75rem] bg-white p-3.5 shadow-[0_14px_34px_-28px_rgba(24,60,67,0.7)] ring-1 ring-[#e6e6e2]">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef7f5] text-2xl",
            special ? "" : "animate-kz-bob"
          )}
        >
          {world?.guide || "🦁"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0f7d75]">
              {world?.guideName || "Your guide"}
            </p>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider",
                speaking ? "bg-[#e6f6f4] text-[#0f7d75]" : "bg-[#f1f0f0] text-[#93a3a3]"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", speaking ? "animate-pulse bg-[#159b91]" : "bg-[#b7c2c2]")} />
              {speaking ? "Reading aloud" : "Ready to help"}
            </span>
          </div>

          <p className="mt-1 text-sm font-bold leading-snug text-[#3f5f63]">{instruction}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={readAloud}
              className="kz-btn gap-1.5 rounded-full bg-[#159b91] px-3.5 py-1.5 text-[11px] font-extrabold text-white active:translate-y-[2px]"
            >
              <Volume2 className="h-3.5 w-3.5" /> Read it to me
            </button>
            <span className="text-[10px] font-bold text-[#9aa8a8]">
              Guided audio is on. The talking AI Agent arrives soon.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
