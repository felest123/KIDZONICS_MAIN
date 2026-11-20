import { useCallback, useEffect, useRef, useState } from "react";
import { reportDevice } from "@/lib/kioskReport";

// Basic presence check: samples camera frames on a tiny canvas and looks at
// brightness spread plus frame-to-frame change. No face recognition, no storage.
const VARIANCE_MIN = 18;
const MOTION_MIN = 3;

export default function useCameraReadiness({ autoStart = true, tolerant = false } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const prevRef = useRef(null);
  const emptyRef = useRef(0);

  const [status, setStatus] = useState("idle"); // idle | requesting | ready | denied | unavailable
  const [detected, setDetected] = useState(false);
  const [motion, setMotion] = useState(0);
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    prevRef.current = null;
    emptyRef.current = 0;
    setDetected(false);
    setMotion(0);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      reportDevice("camera", "unavailable");
      setError("This device has no camera we can use.");
      return;
    }
    setStatus("requesting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("ready");
      reportDevice("camera", "ok");
    } catch (err) {
      const denied = ["NotAllowedError", "SecurityError", "NotReadableError"].includes(err?.name);
      setStatus(denied ? "denied" : "unavailable");
      reportDevice("camera", denied ? "blocked" : "unavailable");
      setError(
        denied
          ? "The camera is not allowed yet. Ask your teacher to allow it, then tap Retry."
          : "We could not start the camera on this device."
      );
    }
  }, []);

  useEffect(() => {
    if (!autoStart) return undefined;
    start();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [autoStart, start]);

  useEffect(() => {
    if (status !== "ready") return undefined;

    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const canvas = canvasRef.current || (canvasRef.current = document.createElement("canvas"));
      canvas.width = 64;
      canvas.height = 48;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 64, 48);

      let pixels;
      try {
        pixels = ctx.getImageData(0, 0, 64, 48).data;
      } catch {
        return;
      }

      const count = 64 * 48;
      const gray = new Float32Array(count);
      const prev = prevRef.current;
      let sum = 0;
      let sumSq = 0;
      let diff = 0;

      for (let i = 0; i < count; i += 1) {
        const l = pixels[i * 4] * 0.299 + pixels[i * 4 + 1] * 0.587 + pixels[i * 4 + 2] * 0.114;
        gray[i] = l;
        sum += l;
        sumSq += l * l;
        if (prev) diff += Math.abs(l - prev[i]);
      }

      const mean = sum / count;
      const variance = sumSq / count - mean * mean;
      const movement = prev ? diff / count : 0;
      prevRef.current = gray;
      setMotion(Math.round(movement * 10) / 10);

      const minVariance = tolerant ? VARIANCE_MIN * 0.6 : VARIANCE_MIN;
      const minMovement = tolerant ? MOTION_MIN * 1.8 : MOTION_MIN;
      const lit = mean > 12 && mean < 246;
      const present = lit && (variance > minVariance || movement > minMovement);

      if (present) {
        emptyRef.current = 0;
        setDetected(true);
      } else {
        emptyRef.current += 1;
        if (emptyRef.current > (tolerant ? 8 : 4)) setDetected(false);
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [status, tolerant]);

  return { videoRef, status, detected, motion, error, start, stop };
}
