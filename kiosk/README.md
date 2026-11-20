# KidZonics Kiosk (Raspberry Pi + USB RFID reader)

This folder turns a Raspberry Pi with a touchscreen and a USB RFID reader into the
KidZonics classroom kiosk.

```
 USB RFID reader ──► kidzonics-bridge (on the Pi) ──► Base44 rfidBridge function
                                                              │
 Touchscreen ◄── Chromium, full screen ◄── KidZonics app ◄────┘  (teacher card sign-in)
```

| Part | What it does |
|---|---|
| `bridge/kidzonics_bridge.py` | Takes over the USB reader so card numbers are never typed into the screen, sends each tap to `rfidBridge`, and sends a heartbeat every 30 s so the app shows "RFID reader connected". |
| `systemd/kidzonics-bridge.service` | Starts the bridge at boot and restarts it if it stops. Runs as a locked-down `kzbridge` user. |
| `browser/kidzonics-kiosk.sh` | Opens the app full screen in Chromium, keeps the screen on, and reopens Chromium if it closes. |
| `install.sh` | Installs all of the above, plus Chromium policies: microphone and camera allowed for the app only, no saved passwords. |
| `src/components/KioskIdle.jsx` (app) | Kiosk only: after 3 minutes without a touch, asks "Are you still there?", then signs out the student (and any teacher) and goes back to the start page. |

Students never use cards; they still pick their name. Cards are for teachers.

## What you need

- Raspberry Pi 4 or 5 with **Raspberry Pi OS (desktop)**, Bookworm or newer
- Touchscreen (768–1280 px wide works best), speaker and USB microphone
- A USB RFID reader that types the card number like a keyboard (125 kHz EM4100 or 13.56 MHz, whichever matches your cards)
- Your published KidZonics address (for example `https://your-app.base44.app`) and app id (from `app.base44.com/apps/<APP_ID>/...`)

## Setup

1. Copy this `kiosk` folder to the Pi (USB stick or `git clone`), then:

   ```bash
   cd kiosk
   sudo ./install.sh --url https://your-app.base44.app --app-id YOUR_APP_ID
   ```

2. **Add the kiosk token to Base44.** The installer creates a random token. Show it with:

   ```bash
   sudo grep KIOSK_BRIDGE_TOKEN /etc/kidzonics/bridge.env
   ```

   In the Base44 dashboard, open your app, go to **Settings → Secrets**, and add a secret named
   `KIOSK_BRIDGE_TOKEN` with that value. Keep the token private. Anyone who has it can send fake card taps.

3. **Find the reader.** Run this, then tap any card on the reader:

   ```bash
   sudo /opt/kidzonics/bridge/kidzonics_bridge.py --detect
   ```

   Copy the `READER_DEVICE=...` line it prints into `/etc/kidzonics/bridge.env`, then restart the bridge:

   ```bash
   sudo nano /etc/kidzonics/bridge.env
   ```

   ```bash
   sudo systemctl restart kidzonics-bridge
   ```

4. **Check the Pi can reach the app.** This should print `ok`:

   ```bash
   sudo bash -c 'set -a; . /etc/kidzonics/bridge.env; /opt/kidzonics/bridge/kidzonics_bridge.py --ping'
   ```

5. Reboot. The Pi logs in and opens KidZonics full screen.

   ```bash
   sudo reboot
   ```

6. **Link each teacher's card.** The teacher signs in, opens **Settings → Account preferences → RFID card → Link my card**, and taps
   their card on the kiosk reader within a minute. After that, tapping the card on the teacher sign-in
   screen fills in their account, and they only type their password.

## Settings

`/etc/kidzonics/kiosk.env`. Changes apply after a reboot.

| Setting | Default | Meaning |
|---|---|---|
| `KIOSK_URL` | none | Your app address |
| `KIOSK_START_PATH` | `/` | Start page. Use `/identify` to skip the landing page. |
| `KIOSK_IDLE_SECONDS` | `180` | Idle time before "Are you still there?". `0` turns it off (minimum 30). |
| `KIOSK_LOCK_URLS` | `no` | `yes` blocks every site except the app and Base44/Google sign-in. Rerun `install.sh` after changing it, and test lessons, videos and teacher sign-in. |

`/etc/kidzonics/bridge.env`: `BASE44_APP_ID`, `KIOSK_BRIDGE_TOKEN`, `READER_DEVICE` / `READER_NAME`,
`KIOSK_DEVICE_NAME`, `HEARTBEAT_SECONDS`. Restart the bridge after changes.

## Troubleshooting

| Symptom | Check |
|---|---|
| Sign-in screen says "RFID reader not connected" | Watch the bridge log with `journalctl -u kidzonics-bridge -f`. `--ping` explains token or app id problems. |
| `--ping` says the token does not match | The Base44 secret and `bridge.env` must be identical. Publish the app after adding the secret. |
| "Found N keyboard-like devices" | Set `READER_DEVICE` using `--detect`. |
| Card number appears on screen | The bridge is not running or `READER_DEVICE` points at the wrong device. |
| Tap is ignored | The same card within 2 seconds is ignored on purpose. Taps expire after 2 minutes. |
| No voice when a letter is read aloud | Check `speech-dispatcher` and `espeak-ng` are installed, and the Pi's audio output (`raspi-config` → System → Audio). |
| Microphone does not work | Plug in the USB mic before boot. Check it with `arecord -l`. |
| Leave kiosk mode | Plug in a keyboard and press `Alt+F4`. Chromium reopens after 2 seconds, so stop it with `pkill -f kidzonics-kiosk.sh` first. |
| Use this browser as a normal device again | Open the app once with `?kiosk=0` |

## Developing

```bash
python3 -m unittest discover -s kiosk/bridge
```

The tests cover card decoding, debouncing, settings, the HTTP calls (against a fake `rfidBridge`),
and the full bridge loop with a fake reader, including unplugging it. No Pi needed.
