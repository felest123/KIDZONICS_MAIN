import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, RotateCcw, ShieldCheck, UserX } from "lucide-react";
import useCameraReadiness from "@/hooks/useCameraReadiness";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

const TOTAL = 5;

function StatusChip({ on, children, tone = "teal" }) {
  const tones = {
    teal: on ? "bg-[#0d9488] text-white" : "bg-[#eef4f4] text-[#8aa5a9]",
    orange: on ? "bg-[#f97316] text-white" : "bg-[#eef4f4] text-[#8aa5a9]",
  };
  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide", tones[tone])}>
      {children}
    </span>
  );
}

export default function ReadinessCheck({ student, world, special = false, onReady, onBack }) {
  const { videoRef, status, detected, error, start } = useCameraReadiness({ tolerant: special });
  const [count, setCount] = useState(TOTAL);
  const firedRef = useRef(false);

  const ready = status === "ready";
  const blocked = status === "denied" || status === "unavailable";

  useEffect(() => {
    speak("Please get ready! Stay in front of the camera!", { rate: special ? 0.62 : 0.9 });
  }, [special]);

  useEffect(() => {
    if (!ready || !detected) {
      setCount(TOTAL);
      return undefined;
    }
    const id = window.setInterval(() => setCount((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [ready, detected]);

  useEffect(() => {
    if (count !== 0 || firedRef.current) return;
    firedRef.current = true;
    speak("Wonderful! Let's learn together!", { rate: special ? 0.62 : 0.92 });
    onReady();
  }, [count, onReady, special]);

  return (
    <div className={cn("min-h-screen", special ? "bg-[#f6f4ee]" : "bg-gradient-to-b from-[#cdeefb] via-[#e6f7fe] to-[#fdf8ec]")}>
      <header className="sticky top-0 z-30 bg-[#2c4a52] px-3 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <button onClick={onBack} className="kz-btn gap-2 rounded-full bg-white/15 px-4 py-3 text-sm text-white">
            ← My map
          </button>
          <div className="text-center">
            <p className="font-display text-sm font-extrabold text-[#5fd4c8]">{world?.world}</p>
            <p className="font-display text-lg font-extrabold leading-none text-white">Get ready to learn!</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fcd34d] text-xl">
            {student?.avatar || "🙂"}
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-3 pb-16 pt-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[2rem] border-4 border-white bg-white p-3 shadow-[0_18px_36px_-26px_rgba(44,74,82,0.8)]">
          <div className="relative overflow-hidden rounded-[1.4rem] bg-[#123039]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn("h-[280px] w-full scale-x-[-1] object-cover sm:h-[340px]", !ready && "opacity-0")}
            />
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
                {blocked ? <CameraOff className="h-8 w-8 text-white/70" /> : <Camera className="h-8 w-8 animate-pulse text-white/70" />}
                <p className="text-sm font-bold text-white/85">
                  {blocked ? error : status === "requesting" ? "Turning on the camera…" : "Waiting for the camera…"}
                </p>
                {blocked && (
                  <button onClick={start} className="mt-1 flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#2c4a52]">
                    <RotateCcw className="h-3.5 w-3.5" /> Retry camera
                  </button>
                )}
              </div>
            )}
            {ready && (
              <span
                className={cn(
                  "absolute left-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white",
                  detected ? "bg-[#0d9488]" : "bg-[#f97316]"
                )}
              >
                {detected ? <Check className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                {detected ? "I can see you" : "I cannot see you"}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusChip on={ready}>{ready ? "Camera ready" : status === "requesting" ? "Camera starting" : "Camera off"}</StatusChip>
            <StatusChip on={ready && detected} tone="teal">
              {detected ? "Student detected" : "Student not detected"}
            </StatusChip>
            <span className="flex items-center gap-1 rounded-full bg-[#eaf7f5] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#0d6f74]">
              <ShieldCheck className="h-3 w-3" /> No video saved
            </span>
          </div>

          <p className="mt-2 text-[11px] font-bold leading-snug text-[#8aa5a9]">
            The camera does a simple presence check (light and movement in front of the screen). It does not recognise
            faces and no video or photo is stored.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[2rem] border-4 border-white bg-white p-5 text-center shadow-[0_18px_36px_-26px_rgba(44,74,82,0.8)]">
          <span className={cn("text-5xl", special ? "" : "animate-kz-bob")}>{world?.guide || "🦁"}</span>

          <div className="relative mt-3 flex h-28 w-28 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-[7px] border-[#eef4f4]" />
            <span
              className="absolute inset-0 rounded-full border-[7px] border-[#0d9488] transition-all duration-500"
              style={{ clipPath: `inset(${100 - ((TOTAL - count) / TOTAL) * 100}% 0 0 0)` }}
            />
            <span className="font-display text-5xl font-extrabold text-[#2c4a52]">{detected && ready ? count : "--"}</span>
          </div>

          <p className={cn("mt-3 font-display font-extrabold leading-tight text-[#2c4a52]", special ? "text-2xl" : "text-xl sm:text-2xl")}>
            {blocked
              ? "We need the camera to get ready."
              : ready && !detected
                ? "Listen and Stay Still! Please position yourself in front of the camera."
                : "Please get ready! Stay in front of the camera!"}
          </p>

          <p className="mt-2 max-w-xs text-sm font-bold text-[#6b8a90]">
            {blocked
              ? "Ask your teacher to allow the camera, then tap Retry. You can still learn without the camera check."
              : ready && !detected
                ? "The countdown waits for you. Come back in front of the camera and it will start again."
                : "The lesson starts by itself when the countdown finishes."}
          </p>

          {ready && !detected && (
            <div className="mt-3 rounded-2xl bg-[#fff4e5] px-4 py-2 text-xs font-extrabold text-[#b05e00]">
              Countdown paused
            </div>
          )}

          {blocked && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={start}
                className="kz-btn gap-2 rounded-full bg-[#0d9488] px-6 py-3 text-sm text-white shadow-[0_5px_0_#0a6f66] active:translate-y-[2px] active:shadow-none"
              >
                <RotateCcw className="h-4 w-4" /> Retry camera
              </button>
              <button onClick={onReady} className="rounded-full bg-white px-5 py-2 text-xs font-extrabold text-[#6b8a90]">
                Skip check (teacher)
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
