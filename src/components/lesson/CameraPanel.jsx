import { Camera, CameraOff, Check, RotateCcw } from "lucide-react";
import useCameraReadiness from "@/hooks/useCameraReadiness";
import { cn } from "@/lib/utils";

export default function CameraPanel({ special = false }) {
  const { videoRef, status, detected, error, start, stop } = useCameraReadiness({ tolerant: special });
  const ready = status === "ready";
  const blocked = status === "denied" || status === "unavailable";

  const statusLabel = ready
    ? detected
      ? "I can see you"
      : "Come back in front"
    : blocked
      ? "Unavailable"
      : status === "requesting"
        ? "Starting…"
        : "Camera off";

  return (
    <section className="rounded-[1.75rem] bg-[#10363e] p-3.5 shadow-[0_18px_40px_-28px_rgba(16,54,62,0.95)]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8fd6cf]">
          <Camera className="h-3.5 w-3.5" /> Camera
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide",
            ready
              ? detected
                ? "bg-[#159b91] text-white"
                : "bg-[#f5d34a] text-[#183c43]"
              : "bg-white/10 text-[#a9c9c9]"
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="relative mt-2.5 overflow-hidden rounded-[1.3rem] bg-[#0b2830]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn("h-[13rem] w-full scale-x-[-1] object-cover object-top sm:h-[15rem]", !ready && "opacity-0")}
        />

        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
            <CameraOff className="h-7 w-7 text-[#8fd6cf]" />
            <p className="text-xs font-bold leading-snug text-[#d7e9e8]">
              {blocked
                ? error
                : status === "requesting"
                  ? "Turning on the camera…"
                  : "The camera is off. Tap below to turn it on."}
            </p>
            <button
              onClick={start}
              className="flex items-center gap-1.5 rounded-full bg-[#f5d34a] px-4 py-2 text-xs font-extrabold text-[#183c43] active:translate-y-[2px]"
            >
              {blocked ? <RotateCcw className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
              {blocked ? "Retry" : "Turn on camera"}
            </button>
          </div>
        )}

        {ready && (
          <>
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[#159b91]/95 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
              <Check className="h-3 w-3" /> Camera on
            </span>
            <button
              onClick={stop}
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-extrabold text-white"
            >
              <CameraOff className="h-3 w-3" /> Off
            </button>
          </>
        )}
      </div>

      <p className="mt-2 text-[10px] font-bold leading-snug text-[#9ec2c1]">
        Simple presence check only (light and movement). No face recognition, no video or photo saved.
      </p>
    </section>
  );
}
