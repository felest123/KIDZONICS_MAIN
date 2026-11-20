#!/usr/bin/env python3
"""KidZonics RFID bridge for a Raspberry Pi kiosk.

A USB "plug-and-play" RFID reader behaves like a keyboard: when a card is
tapped it types the card number and presses Enter. Left alone, those
keystrokes would land in the kiosk browser. This bridge takes the reader
over exclusively (evdev grab), so the card number never reaches the screen,
and forwards each tap to the app's `rfidBridge` backend function:

    POST {"card_uid": "...", "device": "..."}   on every card tap
    POST {"ping": true, "device": "..."}        every HEARTBEAT_SECONDS

Both requests carry the shared secret in the `x-kiosk-token` header. The
backend hashes the UID; the raw card number is never stored.

Commands:
    kidzonics_bridge.py            run the bridge (what systemd starts)
    kidzonics_bridge.py --list     list input devices that can type keys
    kidzonics_bridge.py --detect   tap a card to find which device is the reader
    kidzonics_bridge.py --ping     send one heartbeat and report the result

Settings come from environment variables (see bridge.env.example).
"""

import argparse
import json
import logging
import os
import select
import signal
import sys
import time
import urllib.error
import urllib.request

log = logging.getLogger("kidzonics-bridge")

# --------------------------------------------------------------------------
# Key decoding (pure Python so it can be unit-tested without evdev)
# --------------------------------------------------------------------------

_CHARS = {f"KEY_{d}": d for d in "0123456789"}
_CHARS.update({f"KEY_KP{d}": d for d in "0123456789"})
_CHARS.update({f"KEY_{c}": c for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"})
_ENTER = {"KEY_ENTER", "KEY_KPENTER"}

KEY_DOWN = 1  # evdev key event values: 0 = up, 1 = down, 2 = auto-repeat


class CardDecoder:
    """Turns a stream of key-down events into card UIDs.

    A reader types a whole UID in well under a second. If the gap between
    keys is longer than `max_gap`, the partial input is dropped. That keeps
    stray presses from glueing onto the next card.
    """

    def __init__(self, min_length=4, max_length=32, max_gap=0.5):
        self.min_length = min_length
        self.max_length = max_length
        self.max_gap = max_gap
        self._buffer = []
        self._last = 0.0

    def feed(self, key_name, value, now):
        """Feed one key event. Returns a UID string when a card is complete."""
        if value != KEY_DOWN:
            return None
        if self._buffer and now - self._last > self.max_gap:
            self._buffer = []
        self._last = now

        if key_name in _ENTER:
            uid = "".join(self._buffer)
            self._buffer = []
            if self.min_length <= len(uid) <= self.max_length:
                return uid
            return None

        char = _CHARS.get(key_name)
        if char is None:
            return None  # shift, punctuation and similar are ignored
        if len(self._buffer) >= self.max_length:
            self._buffer = []  # runaway input, not a card
            return None
        self._buffer.append(char)
        return None


class Debouncer:
    """Ignores the same card tapped again within `window` seconds."""

    def __init__(self, window=2.0):
        self.window = window
        self._last_uid = None
        self._last_at = 0.0

    def accept(self, uid, now):
        if uid == self._last_uid and now - self._last_at < self.window:
            return False
        self._last_uid = uid
        self._last_at = now
        return True


def key_name(code):
    """evdev may map one code to several names; return the first KEY_ one."""
    from evdev import ecodes

    name = ecodes.KEY.get(code)
    if isinstance(name, (list, tuple)):
        name = next((n for n in name if n.startswith("KEY_")), name[0])
    return name or ""


# --------------------------------------------------------------------------
# Settings
# --------------------------------------------------------------------------


class Config:
    def __init__(self, env=None):
        env = os.environ if env is None else env
        self.app_id = env.get("BASE44_APP_ID", "").strip()
        self.token = env.get("KIOSK_BRIDGE_TOKEN", "").strip()
        self.server = env.get("BASE44_SERVER_URL", "https://base44.app").strip().rstrip("/")
        self.url = env.get("BRIDGE_URL", "").strip()
        if not self.url and self.app_id:
            self.url = f"{self.server}/api/apps/{self.app_id}/functions/rfidBridge"
        self.device_name = env.get("KIOSK_DEVICE_NAME", "").strip() or _hostname()
        self.reader_device = env.get("READER_DEVICE", "").strip()
        self.reader_name = env.get("READER_NAME", "").strip()
        self.heartbeat = max(10, int(env.get("HEARTBEAT_SECONDS", "30") or 30))
        self.min_length = int(env.get("CARD_MIN_LENGTH", "4") or 4)

    def problems(self):
        missing = []
        if not self.url:
            missing.append("BASE44_APP_ID (or BRIDGE_URL)")
        if not self.token:
            missing.append("KIOSK_BRIDGE_TOKEN")
        return missing


def _hostname():
    try:
        return os.uname().nodename[:60] or "kiosk"
    except AttributeError:
        return "kiosk"


# --------------------------------------------------------------------------
# Talking to the app
# --------------------------------------------------------------------------


class BridgeClient:
    def __init__(self, config, timeout=8.0):
        self.config = config
        self.timeout = timeout

    def _post(self, payload):
        body = json.dumps({**payload, "device": self.config.device_name}).encode()
        headers = {
            "Content-Type": "application/json",
            "x-kiosk-token": self.config.token,
            "User-Agent": "kidzonics-bridge/1.0",
        }
        if self.config.app_id:
            headers["X-App-Id"] = self.config.app_id
        request = urllib.request.Request(self.config.url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                return response.status, _json(response.read())
        except urllib.error.HTTPError as error:
            return error.code, _json(error.read())

    def ping(self):
        return self._post({"ping": True})

    def send_card(self, uid):
        return self._post({"card_uid": uid})


def _json(raw):
    try:
        return json.loads(raw.decode() or "{}")
    except (ValueError, UnicodeDecodeError):
        return {}


def explain(status, data):
    if status == 200:
        return "ok"
    if status == 401:
        return "the kiosk token does not match KIOSK_BRIDGE_TOKEN in Base44 secrets"
    if status == 503:
        return "KIOSK_BRIDGE_TOKEN is not set in the app's Base44 secrets yet"
    if status == 404:
        return "rfidBridge was not found; check BASE44_APP_ID and that the app is published"
    return f"HTTP {status}: {data.get('error') or data}"


def send_with_retry(client, uid, deadline_seconds=45):
    """Retry a tap briefly. The app ignores taps older than 2 minutes, so
    there is no point queueing one for longer than this."""
    started = time.monotonic()
    delay = 1.0
    while True:
        try:
            status, data = client.send_card(uid)
            if status == 200:
                matched = data.get("matched")
                log.info("Card sent (%s)", "known teacher card" if matched else "unknown card")
                return True
            if status in (400, 401, 404, 503):
                log.error("Card rejected: %s", explain(status, data))
                return False  # retrying will not help
            log.warning("Card send failed: %s", explain(status, data))
        except (urllib.error.URLError, OSError) as error:
            log.warning("Card send failed: %s", error)
        if time.monotonic() - started + delay > deadline_seconds:
            log.error("Gave up sending card after %ds", deadline_seconds)
            return False
        time.sleep(delay)
        delay = min(delay * 2, 8.0)


# --------------------------------------------------------------------------
# Finding the reader
# --------------------------------------------------------------------------


def keyboard_devices():
    import evdev

    found = []
    for path in evdev.list_devices():
        try:
            device = evdev.InputDevice(path)
        except OSError:
            continue
        keys = device.capabilities().get(evdev.ecodes.EV_KEY, [])
        if evdev.ecodes.KEY_ENTER in keys and evdev.ecodes.KEY_1 in keys:
            found.append(device)
        else:
            device.close()
    return found


def stable_path(device_path):
    """Prefer /dev/input/by-id/… which survives reboots and re-plugging."""
    by_id = "/dev/input/by-id"
    if os.path.isdir(by_id):
        for name in sorted(os.listdir(by_id)):
            full = os.path.join(by_id, name)
            if os.path.realpath(full) == os.path.realpath(device_path):
                return full
    return device_path


def open_reader(config):
    import evdev

    if config.reader_device:
        if not os.path.exists(config.reader_device):
            return None
        return evdev.InputDevice(config.reader_device)

    candidates = keyboard_devices()
    chosen = None
    if config.reader_name:
        wanted = config.reader_name.lower()
        chosen = next((d for d in candidates if wanted in d.name.lower()), None)
    elif len(candidates) == 1:
        chosen = candidates[0]
    for device in candidates:
        if device is not chosen:
            device.close()
    if chosen is None and not config.reader_name and len(candidates) > 1:
        log.error(
            "Found %d keyboard-like devices and cannot tell which is the reader. "
            "Run with --detect and set READER_DEVICE.",
            len(candidates),
        )
    return chosen


# --------------------------------------------------------------------------
# Commands
# --------------------------------------------------------------------------


def cmd_list():
    devices = keyboard_devices()
    if not devices:
        print("No keyboard-like input devices found (is the reader plugged in? are you in the 'input' group?)")
        return 1
    for device in devices:
        print(f"{stable_path(device.path)}\n    name: {device.name}\n")
        device.close()
    return 0


def cmd_detect(timeout=60):
    devices = {d.fd: d for d in keyboard_devices()}
    if not devices:
        print("No keyboard-like input devices found.")
        return 1
    decoders = {fd: CardDecoder() for fd in devices}
    print(f"Listening on {len(devices)} device(s). Tap a card on the reader now…")
    end = time.monotonic() + timeout
    try:
        while time.monotonic() < end:
            ready, _, _ = select.select(list(devices), [], [], 1.0)
            for fd in ready:
                device = devices[fd]
                for event in device.read():
                    if event.type != 1:  # EV_KEY
                        continue
                    uid = decoders[fd].feed(key_name(event.code), event.value, time.monotonic())
                    if uid:
                        print("\nFound the reader:")
                        print(f"    name: {device.name}")
                        print(f"    card number length: {len(uid)} characters")
                        print("\nPut this line in /etc/kidzonics/bridge.env:")
                        print(f"    READER_DEVICE={stable_path(device.path)}")
                        return 0
    finally:
        for device in devices.values():
            device.close()
    print("No card was read. Check the reader is plugged in and its light comes on when you tap a card.")
    return 1


def cmd_ping(config):
    client = BridgeClient(config)
    try:
        status, data = client.ping()
    except (urllib.error.URLError, OSError) as error:
        print(f"Could not reach {config.url}: {error}")
        return 1
    print(f"{config.url}\n  -> {explain(status, data)}")
    return 0 if status == 200 else 1


_stop = False


def _handle_stop(*_):
    global _stop
    _stop = True


def cmd_run(config):
    import evdev

    signal.signal(signal.SIGTERM, _handle_stop)
    signal.signal(signal.SIGINT, _handle_stop)

    client = BridgeClient(config)
    decoder = CardDecoder(min_length=config.min_length)
    debouncer = Debouncer()
    next_ping = 0.0
    device = None
    warned_missing = False

    log.info("KidZonics bridge starting; sending to %s as '%s'", config.url, config.device_name)

    while not _stop:
        now = time.monotonic()
        if now >= next_ping:
            next_ping = now + config.heartbeat
            if device is not None:  # only report "connected" while a reader is attached
                try:
                    status, data = client.ping()
                    if status != 200:
                        log.warning("Heartbeat failed: %s", explain(status, data))
                except (urllib.error.URLError, OSError) as error:
                    log.warning("Heartbeat failed: %s", error)

        if device is None:
            try:
                device = open_reader(config)
            except OSError as error:
                log.error("Cannot open reader: %s (is this user in the 'input' group?)", error)
                device = None
            if device is None:
                if not warned_missing:
                    log.warning("Waiting for the RFID reader to be plugged in…")
                    warned_missing = True
                time.sleep(3)
                continue
            try:
                device.grab()  # exclusive: keystrokes no longer reach the browser
            except OSError as error:
                log.error("Could not take over the reader: %s", error)
                device.close()
                device = None
                time.sleep(3)
                continue
            warned_missing = False
            next_ping = 0.0  # tell the app straight away
            log.info("Reader ready: %s (%s)", device.name, stable_path(device.path))
            continue

        try:
            ready, _, _ = select.select([device.fd], [], [], 1.0)
            if not ready:
                continue
            for event in device.read():
                if event.type != evdev.ecodes.EV_KEY:
                    continue
                stamp = time.monotonic()
                uid = decoder.feed(key_name(event.code), event.value, stamp)
                if uid and debouncer.accept(uid, stamp):
                    log.info("Card tapped (%d characters)", len(uid))  # never log the number itself
                    send_with_retry(client, uid)
        except OSError:
            log.warning("Reader disconnected")
            try:
                device.close()
            except OSError:
                pass
            device = None

    if device is not None:
        try:
            device.ungrab()
            device.close()
        except OSError:
            pass
    log.info("Bridge stopped")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description="KidZonics RFID bridge")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--list", action="store_true", help="list keyboard-like input devices")
    group.add_argument("--detect", action="store_true", help="tap a card to identify the reader")
    group.add_argument("--ping", action="store_true", help="send one heartbeat to the app")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(message)s",
    )

    if args.list or args.detect:
        try:
            import evdev  # noqa: F401
        except ImportError:
            print("python3-evdev is missing. Install it with: sudo apt install python3-evdev")
            return 1
        return cmd_list() if args.list else cmd_detect()

    config = Config()
    problems = config.problems()
    if problems:
        print("Missing settings: " + ", ".join(problems) + ". See /etc/kidzonics/bridge.env")
        return 2
    if args.ping:
        return cmd_ping(config)
    return cmd_run(config)


if __name__ == "__main__":
    sys.exit(main())
