"""Tests for the parts of the bridge that do not need a Raspberry Pi.

Run: python3 -m unittest discover -s kiosk/bridge
"""

import http.server
import json
import threading
import unittest

import kidzonics_bridge as kb


def type_card(decoder, text, start=0.0, step=0.01, enter="KEY_ENTER"):
    """Simulate a reader typing `text` then Enter; returns the decoded UID."""
    t = start
    result = None
    for ch in text:
        name = f"KEY_{ch.upper()}"
        decoder.feed(name, kb.KEY_DOWN, t)
        decoder.feed(name, 0, t)  # key up is ignored
        t += step
    result = decoder.feed(enter, kb.KEY_DOWN, t)
    return result


class CardDecoderTest(unittest.TestCase):
    def test_reads_a_ten_digit_card(self):
        self.assertEqual(type_card(kb.CardDecoder(), "0012345678"), "0012345678")

    def test_reads_hex_and_keypad_enter(self):
        self.assertEqual(type_card(kb.CardDecoder(), "a1b2c3d4", enter="KEY_KPENTER"), "A1B2C3D4")

    def test_keypad_digits(self):
        d = kb.CardDecoder()
        for i, digit in enumerate("4321"):
            d.feed(f"KEY_KP{digit}", kb.KEY_DOWN, i * 0.01)
        self.assertEqual(d.feed("KEY_ENTER", kb.KEY_DOWN, 0.05), "4321")

    def test_too_short_is_ignored(self):
        self.assertIsNone(type_card(kb.CardDecoder(), "12"))

    def test_slow_typing_resets_buffer(self):
        d = kb.CardDecoder(max_gap=0.5)
        d.feed("KEY_9", kb.KEY_DOWN, 0.0)  # a stray press…
        self.assertEqual(type_card(d, "12345678", start=5.0), "12345678")  # …is not glued on

    def test_ignores_shift_and_autorepeat(self):
        d = kb.CardDecoder()
        d.feed("KEY_LEFTSHIFT", kb.KEY_DOWN, 0.0)
        d.feed("KEY_1", 2, 0.01)  # auto-repeat
        self.assertEqual(type_card(d, "5555", start=0.02), "5555")

    def test_runaway_input_is_dropped(self):
        d = kb.CardDecoder(max_length=8)
        self.assertIsNone(type_card(d, "1" * 20))
        self.assertEqual(type_card(d, "87654321", start=1.0), "87654321")

    def test_two_cards_in_a_row(self):
        d = kb.CardDecoder()
        self.assertEqual(type_card(d, "11112222"), "11112222")
        self.assertEqual(type_card(d, "33334444", start=0.2), "33334444")


class DebouncerTest(unittest.TestCase):
    def test_same_card_quickly_is_ignored(self):
        d = kb.Debouncer(window=2.0)
        self.assertTrue(d.accept("A", 0.0))
        self.assertFalse(d.accept("A", 1.0))
        self.assertTrue(d.accept("A", 3.5))

    def test_different_card_is_accepted(self):
        d = kb.Debouncer(window=2.0)
        self.assertTrue(d.accept("A", 0.0))
        self.assertTrue(d.accept("B", 0.1))


class ConfigTest(unittest.TestCase):
    def test_builds_url_from_app_id(self):
        c = kb.Config({"BASE44_APP_ID": "abc123", "KIOSK_BRIDGE_TOKEN": "t"})
        self.assertEqual(c.url, "https://base44.app/api/apps/abc123/functions/rfidBridge")
        self.assertEqual(c.problems(), [])

    def test_explicit_url_wins(self):
        c = kb.Config({"BRIDGE_URL": "https://x.test/f", "BASE44_APP_ID": "abc", "KIOSK_BRIDGE_TOKEN": "t"})
        self.assertEqual(c.url, "https://x.test/f")

    def test_reports_missing_settings(self):
        self.assertEqual(len(kb.Config({}).problems()), 2)

    def test_heartbeat_has_a_floor(self):
        c = kb.Config({"HEARTBEAT_SECONDS": "1"})
        self.assertEqual(c.heartbeat, 10)


class FakeApp(http.server.BaseHTTPRequestHandler):
    """Mimics base44/functions/rfidBridge/entry.ts."""

    requests = []

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        FakeApp.requests.append({"headers": {k.lower(): v for k, v in self.headers.items()}, "body": body})
        if self.headers.get("x-kiosk-token") != "secret":
            return self._reply(401, {"error": "Unauthorized"})
        if body.get("ping"):
            return self._reply(200, {"ok": True})
        if not body.get("card_uid"):
            return self._reply(400, {"error": "card_uid is required"})
        return self._reply(200, {"ok": True, "matched": body["card_uid"] == "KNOWN"})

    def _reply(self, status, data):
        raw = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def log_message(self, *args):
        pass


class BridgeClientTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.HTTPServer(("127.0.0.1", 0), FakeApp)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}/fn"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def client(self, token="secret"):
        config = kb.Config(
            {"BRIDGE_URL": self.url, "KIOSK_BRIDGE_TOKEN": token, "BASE44_APP_ID": "app1", "KIOSK_DEVICE_NAME": "room-1"}
        )
        return kb.BridgeClient(config, timeout=3)

    def setUp(self):
        FakeApp.requests.clear()

    def test_ping_sends_token_and_device(self):
        status, _ = self.client().ping()
        self.assertEqual(status, 200)
        sent = FakeApp.requests[0]
        self.assertEqual(sent["body"], {"ping": True, "device": "room-1"})
        self.assertEqual(sent["headers"]["x-kiosk-token"], "secret")
        self.assertEqual(sent["headers"]["x-app-id"], "app1")

    def test_card_is_sent(self):
        status, data = self.client().send_card("KNOWN")
        self.assertEqual(status, 200)
        self.assertTrue(data["matched"])
        self.assertEqual(FakeApp.requests[0]["body"]["card_uid"], "KNOWN")

    def test_wrong_token_is_not_retried(self):
        self.assertFalse(kb.send_with_retry(self.client(token="wrong"), "KNOWN"))
        self.assertEqual(len(FakeApp.requests), 1)

    def test_explain_messages(self):
        self.assertIn("does not match", kb.explain(401, {}))
        self.assertIn("not set", kb.explain(503, {}))



class RunLoopTest(unittest.TestCase):
    """Runs the real bridge loop against a fake evdev reader and FakeApp."""

    def test_heartbeat_card_and_unplug(self):
        import os
        import sys
        import types

        codes = {2: "KEY_1", 3: "KEY_2", 4: "KEY_3", 5: "KEY_4", 28: "KEY_ENTER"}
        Event = types.SimpleNamespace

        class FakeDevice:
            name = "Fake RFID Reader"
            path = "/dev/input/event9"

            def __init__(self):
                self.r, self.w = os.pipe()
                self.fd = self.r
                self.grabbed = False
                self.batches = [
                    [Event(type=1, code=c, value=v) for c in (2, 3, 4, 5, 28) for v in (1, 0)],
                    [Event(type=1, code=c, value=1) for c in (2, 3, 4, 5, 28)],  # same card again: debounced
                ]

            def grab(self):
                self.grabbed = True

            def ungrab(self):
                self.grabbed = False

            def read(self):
                os.read(self.r, 1)
                if not self.batches:
                    raise OSError("unplugged")
                return self.batches.pop(0)

            def close(self):
                pass

        device = FakeDevice()
        fake_evdev = types.ModuleType("evdev")
        fake_evdev.ecodes = types.SimpleNamespace(EV_KEY=1, KEY=codes, KEY_ENTER=28, KEY_1=2)
        opened = []

        def fake_open(config):
            if opened:
                kb._stop = True  # after the unplug, finish the test
                return None
            opened.append(device)
            return device

        server = http.server.HTTPServer(("127.0.0.1", 0), FakeApp)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        FakeApp.requests.clear()
        config = kb.Config({
            "BRIDGE_URL": f"http://127.0.0.1:{server.server_port}/fn",
            "KIOSK_BRIDGE_TOKEN": "secret",
            "KIOSK_DEVICE_NAME": "room-1",
        })

        real_open, real_sleep, real_signal = kb.open_reader, kb.time.sleep, kb.signal.signal
        sys.modules["evdev"] = fake_evdev
        kb.open_reader, kb.time.sleep = fake_open, lambda s: None
        kb.signal.signal = lambda *a: None
        kb._stop = False
        try:
            worker = threading.Thread(target=kb.cmd_run, args=(config,), daemon=True)
            worker.start()
            for _ in range(3):  # two key batches, then the unplug
                real_sleep(0.3)
                os.write(device.w, b"x")
            worker.join(timeout=10)
            self.assertFalse(worker.is_alive(), "bridge loop did not stop")
        finally:
            kb.open_reader, kb.time.sleep, kb.signal.signal = real_open, real_sleep, real_signal
            sys.modules.pop("evdev", None)
            kb._stop = False
            server.shutdown()

        bodies = [r["body"] for r in FakeApp.requests]
        self.assertTrue(device.grabbed, "reader was grabbed")
        self.assertEqual(bodies[0], {"ping": True, "device": "room-1"})
        cards = [b for b in bodies if "card_uid" in b]
        self.assertEqual(cards, [{"card_uid": "1234", "device": "room-1"}])


if __name__ == "__main__":
    unittest.main()
