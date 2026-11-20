import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Hand } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { clearKioskStudent, readKioskStudent } from "@/lib/progress";
import { stopSpeaking } from "@/lib/speech";
import { hasSignedInUser, initKioskMode } from "@/lib/kiosk";

const WARNING_SECONDS = 20;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"];

// Read once, before the first render, so ?kiosk=1 is stored straight away.
const settings = initKioskMode();

function mediaPlaying() {
  return [...document.querySelectorAll("video, audio")].some((el) => !el.paused && !el.ended);
}

/**
 * On the shared kiosk only: after a while with no touches, asks
 * "Are you still there?" and then returns to the start page. The child's
 * session (and a teacher's, if they signed in on the kiosk) is cleared, so
 * the next child starts fresh. Does nothing on personal devices.
 */
export default function KioskIdle() {
  const location = useLocation();
  const [countdown, setCountdown] = useState(null);
  const lastActivity = useRef(Date.now());
  const idleSeconds = settings?.idleSeconds || 0;
  const home = settings?.home || "/";

  useEffect(() => {
    if (!idleSeconds) return undefined;
    const touch = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, touch, { passive: true, capture: true }));
    return () => ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, touch, { capture: true }));
  }, [idleSeconds]);

  // Moving to another page counts as activity.
  useEffect(() => {
    lastActivity.current = Date.now();
  }, [location.pathname]);

  useEffect(() => {
    if (!idleSeconds) return undefined;
    const id = window.setInterval(() => {
      const nothingToClear =
        location.pathname === home && !readKioskStudent() && !hasSignedInUser();
      // Waiting on the start page, or watching a video, is not "walking away":
      // the countdown only starts once there is a session to protect.
      if (nothingToClear || mediaPlaying()) lastActivity.current = Date.now();
      const idleFor = (Date.now() - lastActivity.current) / 1000;
      if (idleFor < idleSeconds) {
        setCountdown(null);
        return;
      }
      const left = Math.ceil(idleSeconds + WARNING_SECONDS - idleFor);
      setCountdown(left > 0 ? left : 0);
    }, 1000);
    return () => window.clearInterval(id);
  }, [idleSeconds, home, location.pathname]);

  useEffect(() => {
    if (countdown !== 0) return;
    clearKioskStudent();
    stopSpeaking();
    const target = window.location.origin + home;
    if (hasSignedInUser()) {
      base44.auth.logout(target);
    } else {
      // A full reload also drops any cached student data held in memory.
      window.location.assign(target);
    }
  }, [countdown, home]);

  if (countdown === null || countdown === 0) return null;

  const stay = () => {
    lastActivity.current = Date.now();
    setCountdown(null);
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="kiosk-idle-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#2c4a52]/60 p-6 backdrop-blur-sm"
      onPointerDown={stay}
    >
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff3d6]">
          <Hand className="h-10 w-10 text-[#e0a030]" />
        </div>
        <h2 id="kiosk-idle-title" className="mt-4 font-display text-3xl font-extrabold text-[#2c4a52]">
          Are you still there?
        </h2>
        <p className="mt-2 text-base font-bold text-[#7d9ba0]">
          Tap anywhere to keep playing. Going back to the start in {countdown}…
        </p>
        <button
          type="button"
          onClick={stay}
          className="kz-btn mt-6 w-full rounded-full bg-[#5bbf8a] px-6 py-4 text-xl text-white shadow-md"
        >
          I&apos;m still here!
        </button>
      </div>
    </div>
  );
}
