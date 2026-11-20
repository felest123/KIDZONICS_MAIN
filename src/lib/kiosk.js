// Kiosk mode for the shared classroom screen.
//
// The Raspberry Pi kiosk opens the app with ?kiosk=1&idle=<seconds>. That
// choice is remembered on the device, so it survives reloads and in-app
// navigation. Open any page with ?kiosk=0 to switch it off again.
// Personal devices never see ?kiosk=1, so they are unaffected.

const KEY = "kidz.kiosk";
const DEFAULT_IDLE_SECONDS = 180;
const MIN_IDLE_SECONDS = 30;

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function parseIdle(value) {
  const seconds = Number.parseInt(value, 10);
  if (!Number.isFinite(seconds)) return DEFAULT_IDLE_SECONDS;
  if (seconds <= 0) return 0;
  return Math.max(MIN_IDLE_SECONDS, seconds);
}

/** Reads ?kiosk= / ?idle= once at start-up, stores them and tidies the URL. */
export function initKioskMode() {
  if (typeof window === "undefined") return read();
  const url = new URL(window.location.href);
  const flag = url.searchParams.get("kiosk");
  if (flag === null) return read();

  try {
    if (flag === "0") {
      window.localStorage.removeItem(KEY);
    } else {
      const settings = { idleSeconds: parseIdle(url.searchParams.get("idle")), home: url.pathname || "/" };
      window.localStorage.setItem(KEY, JSON.stringify(settings));
      const name = (url.searchParams.get("name") || "").replace(/[^\w .-]/g, "").slice(0, 60);
      if (name) window.localStorage.setItem("kidz.kioskName", name);
    }
  } catch {
    // Storage blocked: kiosk mode just stays off.
  }
  url.searchParams.delete("kiosk");
  url.searchParams.delete("idle");
  url.searchParams.delete("name");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  return read();
}

export function kioskSettings() {
  return read();
}

export function hasSignedInUser() {
  try {
    return Boolean(window.localStorage.getItem("base44_access_token") || window.localStorage.getItem("token"));
  } catch {
    return false;
  }
}
