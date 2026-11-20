import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { reportDevice } from "@/lib/kioskReport";

const MAX_MS = 4500;

export default function PronunciationCheck({ target, onResult, big = false, label = "Tap the mic, then say it" }) {
  const [phase, setPhase] = useState("idle"); // idle | starting | listening | processing | error
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(0);
  const timerRef = useRef(0);

  const stopMeter = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setLevel(0);
  }, []);

  const startMeter = (stream) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      const data = new Uint8Array(analyser.fftSize);
      let last = 0;
      const loop = (time) => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const value = (data[i] - 128) / 128;
          sum += value * value;
        }
        if (time - last > 100) {
          last = time;
          setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        }
        rafRef.current = window.requestAnimationFrame(loop);
      };
      rafRef.current = window.requestAnimationFrame(loop);
    } catch {
      // The level meter is optional; recording still works without it.
    }
  };

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      const recorder = recorderRef.current;
      if (recorder && recorder.state === "recording") {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const assess = async () => {
    setPhase("processing");
    try {
      const type = chunksRef.current[0]?.type || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      const upload = await base44.integrations.Core.UploadPrivateFile({ file: blob });
      const fileUri = upload?.file_uri;
      if (!fileUri) throw new Error("Upload failed");
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 300 });
      const response = await base44.functions.invoke("assessPronunciation", {
        audio_url: signed?.signed_url,
        target,
      });
      if (response?.data?.error) throw new Error(response.data.error);
      setPhase("idle");
      setError("");
      onResult(response.data);
    } catch (err) {
      setPhase("error");
      if (err?.response?.data?.unavailable) {
        // Turned off by the administrator: no score is made up.
        setError("The voice check is turned off right now. Ask your teacher for help.");
      } else {
        setError("We could not check your voice just now. Please try again.");
      }
    }
  };

  const stop = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") recorder.stop();
  };

  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setPhase("error");
      setError("This device cannot use the microphone yet. Ask your teacher to check it.");
      return;
    }
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      reportDevice("microphone", "ok");
      streamRef.current = stream;
      startMeter(stream);
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        window.clearTimeout(timerRef.current);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        stopMeter();
        await assess();
      };
      recorder.start();
      recorderRef.current = recorder;
      setPhase("listening");
      timerRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, MAX_MS);
    } catch (err) {
      stopMeter();
      setPhase("error");
      const denied = ["NotAllowedError", "SecurityError"].includes(err?.name);
      reportDevice("microphone", denied ? "blocked" : "unavailable");
      setError(
        denied
          ? "The microphone is not allowed yet. Ask your teacher to allow it, then tap Retry."
          : "This device cannot use the microphone yet. Ask your teacher to check it."
      );
    }
  };

  const listening = phase === "listening";
  const processing = phase === "processing";
  const busy = listening || processing || phase === "starting";

  const statusText = processing
    ? "Checking your voice…"
    : listening
      ? "Listening! Tap the red button when you finish"
      : phase === "starting"
        ? "Turning on the microphone…"
        : label;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={listening ? stop : start}
        disabled={processing || phase === "starting"}
        className={cn(
          "relative flex items-center justify-center rounded-full text-white shadow-[0_8px_0_rgba(24,60,67,0.25)] transition active:translate-y-[3px]",
          big ? "h-24 w-24" : "h-20 w-20",
          listening ? "bg-[#e5484d]" : "bg-[#159b91]"
        )}
        aria-label={listening ? "Stop recording" : "Start speaking"}
      >
        {listening && <span className="absolute inset-0 animate-ping rounded-full bg-[#e5484d]/40" />}
        {processing || phase === "starting" ? (
          <Loader2 className={cn("animate-spin", big ? "h-11 w-11" : "h-7 w-7")} />
        ) : listening ? (
          <Square className={big ? "h-11 w-11" : "h-8 w-8"} />
        ) : (
          <Mic className={big ? "h-11 w-11" : "h-9 w-9"} />
        )}
      </button>

      <div className="flex h-6 items-end gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className={cn("w-1.5 rounded-full transition-all", listening ? "bg-[#159b91]" : "bg-[#e3e6e4]")}
            style={{ height: `${6 + (listening ? level * 20 : 0) * (1 - Math.abs(2 - bar) / 3)}px` }}
          />
        ))}
      </div>

      <p
        className={cn(
          "text-center font-display text-sm font-extrabold",
          listening ? "text-[#c93a3f]" : processing ? "text-[#0f7d75]" : "text-[#183c43]"
        )}
      >
        {statusText}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide",
            listening ? "bg-[#fdecec] text-[#b23a3a]" : busy ? "bg-[#e6f6f4] text-[#0f7d75]" : "bg-[#f1f0f0] text-[#93a3a3]"
          )}
        >
          {processing ? "Assessment processing" : listening ? "Microphone listening" : phase === "error" ? "Microphone not ready" : "Microphone ready"}
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-[#fdecec] px-3 py-2 text-center text-[11px] font-bold text-[#b23a3a]">
          {error}
          <button onClick={start} className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px]">
            <RotateCcw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
