import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function (req) {
  try {
    let expected = "";
    try {
      expected = secrets.get("KIOSK_BRIDGE_TOKEN") || "";
    } catch {
      expected = "";
    }
    if (!expected) {
      return Response.json({ error: "RFID bridge is not configured on this app yet." }, { status: 503 });
    }
    const token = req.headers.get("x-kiosk-token") || "";
    if (token !== expected) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const device = String(body.device || "kiosk").slice(0, 60);

    if (body.ping) {
      await base44.asServiceRole.entities.RfidTap.create({
        card_hash: "heartbeat",
        status: "heartbeat",
        device,
        consumed: true,
      });
      return Response.json({ ok: true });
    }

    const uid = typeof body.card_uid === "string" ? body.card_uid.trim() : "";
    if (!uid) return Response.json({ error: "card_uid is required" }, { status: 400 });

    const hash = await sha256(uid);
    const page = await base44.asServiceRole.entities.TeacherCard.filter(
      { card_hash: hash, active: true },
      { limit: 1 }
    );
    const card = page?.items?.[0] || null;

    await base44.asServiceRole.entities.RfidTap.create({
      card_hash: hash,
      status: card ? "authorized" : "unknown",
      teacher_email: card?.teacher_email || "",
      teacher_name: card?.teacher_name || "",
      device,
      consumed: false,
    });

    // Keep the tap table small: drop events older than a day.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.RfidTap.deleteMany({ created_date: { $lt: cutoff } }).catch(() => {});

    return Response.json({ ok: true, matched: Boolean(card) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
