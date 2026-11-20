#!/bin/bash
# Opens KidZonics full screen on the Raspberry Pi and keeps it open.
# Started automatically at desktop login (see install.sh).
set -u

CONFIG=/etc/kidzonics/kiosk.env
# shellcheck source=/dev/null
[ -r "$CONFIG" ] && . "$CONFIG"

KIOSK_URL="${KIOSK_URL:-}"
KIOSK_START_PATH="${KIOSK_START_PATH:-/}"
KIOSK_IDLE_SECONDS="${KIOSK_IDLE_SECONDS:-180}"

if [ -z "$KIOSK_URL" ]; then
  echo "KIOSK_URL is not set in $CONFIG" >&2
  exit 1
fi

# Only one copy, even if more than one autostart mechanism launches us.
exec 9>"${XDG_RUNTIME_DIR:-/tmp}/kidzonics-kiosk.lock"
flock -n 9 || exit 0

BROWSER=""
for candidate in chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then BROWSER="$candidate"; break; fi
done
if [ -z "$BROWSER" ]; then
  echo "Chromium is not installed (sudo apt install chromium)" >&2
  exit 1
fi

# ?kiosk=1 switches on the app's kiosk mode (idle reset); it is remembered.
START="${KIOSK_URL%/}${KIOSK_START_PATH}"
case "$START" in *\?*) SEP="&" ;; *) SEP="?" ;; esac
KIOSK_NAME="$(hostname 2>/dev/null | tr -cd 'A-Za-z0-9._-')"
START="${START}${SEP}kiosk=1&idle=${KIOSK_IDLE_SECONDS}&name=${KIOSK_NAME:-kiosk}"

PROFILE="$HOME/.config/kidzonics-kiosk"
mkdir -p "$PROFILE"

# Keep the screen on.
if command -v xset >/dev/null 2>&1 && [ -n "${DISPLAY:-}" ]; then
  xset s off -dpms s noblank 2>/dev/null || true
fi

# Wait up to a minute for the network so the first page does not fail.
for _ in $(seq 1 20); do
  curl -s -o /dev/null --max-time 5 "$KIOSK_URL" && break
  sleep 3
done

while true; do
  # A power cut leaves "Chromium didn't shut down correctly" behind; clear it.
  PREFS="$PROFILE/Default/Preferences"
  if [ -f "$PREFS" ]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]*"/"exit_type":"Normal"/' "$PREFS"
  fi

  "$BROWSER" \
    --user-data-dir="$PROFILE" \
    --kiosk "$START" \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --disable-session-crashed-bubble \
    --disable-features=Translate,TranslateUI \
    --check-for-update-interval=31536000 \
    --password-store=basic \
    --autoplay-policy=no-user-gesture-required \
    --enable-speech-dispatcher \
    --overscroll-history-navigation=0 \
    --disable-pinch \
    --ozone-platform-hint=auto

  # Chromium closed or crashed: bring it back.
  sleep 2
done
