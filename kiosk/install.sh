#!/bin/bash
# KidZonics kiosk installer for Raspberry Pi OS (Bookworm or newer, desktop).
#
#   sudo ./install.sh --url https://YOUR-APP.base44.app --app-id YOUR_APP_ID
#
# Safe to run again: it keeps the existing settings and kiosk token.
set -euo pipefail

URL=""
APP_ID=""
SKIP_APT=no

usage() {
  sed -n 2,6p "$0" | sed 's/^# \{0,1\}//'
  echo "Options: --url URL  --app-id ID  --skip-apt"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --url) URL="${2:-}"; shift 2 ;;
    --app-id) APP_ID="${2:-}"; shift 2 ;;
    --skip-apt) SKIP_APT=yes; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo ./install.sh --url ... --app-id ..."
  exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
KIOSK_USER="${SUDO_USER:-}"
if [ -z "$KIOSK_USER" ] || [ "$KIOSK_USER" = root ]; then
  KIOSK_USER="$(getent passwd 1000 | cut -d: -f1 || true)"
fi
if [ -z "$KIOSK_USER" ]; then
  echo "Could not work out which desktop user runs the kiosk. Run this with sudo from that user."
  exit 1
fi
KIOSK_HOME="$(getent passwd "$KIOSK_USER" | cut -d: -f6)"

step() { echo; echo "==> $*"; }

# ---------------------------------------------------------------- packages
if [ "$SKIP_APT" = no ]; then
  step "Installing packages"
  apt-get update
  BROWSER_PKG=chromium
  if ! apt-cache show chromium >/dev/null 2>&1; then BROWSER_PKG=chromium-browser; fi
  # speech-dispatcher + espeak-ng give Chromium a voice for "say the letter".
  apt-get install -y python3 python3-evdev curl "$BROWSER_PKG" speech-dispatcher espeak-ng
fi

# ---------------------------------------------------------------- settings
step "Writing settings to /etc/kidzonics"
install -d -m 755 /etc/kidzonics

set_value() { # file key value: replace KEY=... (only when value is given)
  local file="$1" key="$2" value="$3"
  [ -z "$value" ] && return 0
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}
get_value() { grep -E "^$2=" "$1" | tail -1 | cut -d= -f2- || true; }

[ -f /etc/kidzonics/bridge.env ] || install -m 600 "$HERE/config/bridge.env.example" /etc/kidzonics/bridge.env
[ -f /etc/kidzonics/kiosk.env ] || install -m 644 "$HERE/config/kiosk.env.example" /etc/kidzonics/kiosk.env
chmod 600 /etc/kidzonics/bridge.env

set_value /etc/kidzonics/bridge.env BASE44_APP_ID "$APP_ID"
set_value /etc/kidzonics/kiosk.env KIOSK_URL "${URL%/}"

NEW_TOKEN=no
if [ -z "$(get_value /etc/kidzonics/bridge.env KIOSK_BRIDGE_TOKEN)" ]; then
  set_value /etc/kidzonics/bridge.env KIOSK_BRIDGE_TOKEN "$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  NEW_TOKEN=yes
fi

# ---------------------------------------------------------------- bridge
step "Installing the RFID bridge service"
id kzbridge >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin kzbridge
getent group input >/dev/null || groupadd --system input
usermod -aG input kzbridge
install -d -m 755 /opt/kidzonics/bridge
install -m 755 "$HERE/bridge/kidzonics_bridge.py" /opt/kidzonics/bridge/kidzonics_bridge.py
install -m 644 "$HERE/systemd/kidzonics-bridge.service" /etc/systemd/system/kidzonics-bridge.service
systemctl daemon-reload
systemctl enable kidzonics-bridge.service
systemctl restart kidzonics-bridge.service || true

# ---------------------------------------------------------------- browser
step "Setting up the full screen browser for user '$KIOSK_USER'"
install -m 755 "$HERE/browser/kidzonics-kiosk.sh" /opt/kidzonics/kidzonics-kiosk.sh

KIOSK_URL_VALUE="$(get_value /etc/kidzonics/kiosk.env KIOSK_URL)"
LOCK_URLS="$(get_value /etc/kidzonics/kiosk.env KIOSK_LOCK_URLS)"
ORIGIN="$(python3 -c 'import sys,urllib.parse as u; p=u.urlparse(sys.argv[1]); print(f"{p.scheme}://{p.netloc}" if p.netloc else "")' "$KIOSK_URL_VALUE")"

if [ -n "$ORIGIN" ]; then
  POLICY="$(python3 - "$ORIGIN" "$LOCK_URLS" <<'PY'
import json, sys
origin, lock = sys.argv[1], sys.argv[2].strip().lower() == "yes"
policy = {
    # Microphone (pronunciation check) and camera (readiness check) are
    # allowed for the app only, with no pop-up for a child to dismiss.
    "AudioCaptureAllowedUrls": [origin],
    "VideoCaptureAllowedUrls": [origin],
    "AutoplayAllowlist": [origin],
    # A shared screen must never remember a teacher's password.
    "PasswordManagerEnabled": False,
    "AutofillAddressEnabled": False,
    "AutofillCreditCardEnabled": False,
    "BrowserSignin": 0,
    "SyncDisabled": True,
    "BrowserGuestModeEnabled": False,
    "BrowserAddPersonEnabled": False,
    "IncognitoModeAvailability": 1,
    "DeveloperToolsAvailability": 2,
    "TranslateEnabled": False,
    "DefaultBrowserSettingEnabled": False,
    "PromotionalTabsEnabled": False,
    "MetricsReportingEnabled": False,
}
if lock:
    policy["URLBlocklist"] = ["*"]
    policy["URLAllowlist"] = [origin, "base44.app", "base44.com", "accounts.google.com"]
print(json.dumps(policy, indent=2))
PY
)"
  for dir in /etc/chromium/policies/managed /etc/chromium-browser/policies/managed; do
    install -d -m 755 "$dir"
    printf '%s\n' "$POLICY" > "$dir/kidzonics.json"
    chmod 644 "$dir/kidzonics.json"
  done
fi

# Autostart. Recent Raspberry Pi OS uses labwc; older desktops use XDG
# autostart or LXDE. The launcher holds a lock, so starting twice is harmless.
install -d -o "$KIOSK_USER" -g "$KIOSK_USER" "$KIOSK_HOME/.config"
AUTOSTART_DIR="$KIOSK_HOME/.config/autostart"
install -d -o "$KIOSK_USER" -g "$KIOSK_USER" "$AUTOSTART_DIR"
cat > "$AUTOSTART_DIR/kidzonics-kiosk.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=KidZonics Kiosk
Exec=/opt/kidzonics/kidzonics-kiosk.sh
X-GNOME-Autostart-enabled=true
EOF
chown "$KIOSK_USER:$KIOSK_USER" "$AUTOSTART_DIR/kidzonics-kiosk.desktop"

LABWC="$KIOSK_HOME/.config/labwc/autostart"
if [ -d /etc/xdg/labwc ] || [ -d "$KIOSK_HOME/.config/labwc" ]; then
  install -d -o "$KIOSK_USER" -g "$KIOSK_USER" "$(dirname "$LABWC")"
  touch "$LABWC"
  grep -q kidzonics-kiosk.sh "$LABWC" || echo "/opt/kidzonics/kidzonics-kiosk.sh &" >> "$LABWC"
  chown "$KIOSK_USER:$KIOSK_USER" "$LABWC"
fi

# Boot straight to the desktop and never blank the screen.
if command -v raspi-config >/dev/null 2>&1; then
  raspi-config nonint do_boot_behaviour B4 || true
  raspi-config nonint do_blanking 1 || true
fi

# ---------------------------------------------------------------- summary
step "Done"
MISSING=""
[ -z "$(get_value /etc/kidzonics/bridge.env BASE44_APP_ID)" ] && MISSING="$MISSING BASE44_APP_ID (bridge.env)"
[ -z "$KIOSK_URL_VALUE" ] && MISSING="$MISSING KIOSK_URL (kiosk.env)"
if [ -n "$MISSING" ]; then
  echo "Still to fill in:$MISSING  -> then run this installer again."
fi
if [ "$NEW_TOKEN" = yes ]; then
  cat <<EOF

A new kiosk token was created. Add it to your Base44 app as a secret:
  Base44 dashboard > your app > Settings > Secrets
  Name:  KIOSK_BRIDGE_TOKEN
  Value: (shown by the next command)

  sudo grep KIOSK_BRIDGE_TOKEN /etc/kidzonics/bridge.env
EOF
fi
cat <<'EOF'

Next:
  1. Find the reader (tap a card when asked), put the line it prints in
     /etc/kidzonics/bridge.env, then restart the bridge:
       sudo /opt/kidzonics/bridge/kidzonics_bridge.py --detect
       sudo systemctl restart kidzonics-bridge
  2. Check the app accepts the kiosk:
       sudo bash -c 'set -a; . /etc/kidzonics/bridge.env; /opt/kidzonics/bridge/kidzonics_bridge.py --ping'
  3. Reboot. The Pi opens KidZonics full screen.
  Bridge log:  journalctl -u kidzonics-bridge -f
EOF
