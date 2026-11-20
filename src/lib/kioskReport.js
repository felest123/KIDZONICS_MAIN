import { base44 } from "@/api/base44Client";
import { kioskSettings } from "@/lib/kiosk";

// Tells the school's Admin application whether this kiosk's camera and
// microphone really worked, so its System Monitoring shows true status.
// Fire-and-forget: a failed report never affects the child's lesson.
const sent = new Map();

export function reportDevice(kind, status) {
  if (!kioskSettings()) return; // only the classroom kiosk reports, not teachers' own devices
  const key = `${kind}:${status}`;
  const last = sent.get(key) || 0;
  if (Date.now() - last < 5 * 60 * 1000) return;
  sent.set(key, Date.now());
  let device = "kiosk";
  try {
    device = window.localStorage.getItem("kidz.kioskName") || "kiosk";
  } catch {
    // storage blocked: use the default name
  }
  base44.functions.invoke("kioskDevice", { kind, status, device }).catch(() => {});
}
