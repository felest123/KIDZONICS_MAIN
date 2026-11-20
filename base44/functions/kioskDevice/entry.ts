import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Public: a kiosk reports whether its camera and microphone worked in a real
// lesson, so the Admin application can show true device status instead of
// guessing. Only the status word is stored; no audio or images.
const STATES = ["ok", "blocked", "unavailable"];

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body.kind === "camera" || body.kind === "microphone" ? body.kind : "";
    const status = STATES.includes(body.status) ? body.status : "";
    const device = String(body.device || "").replace(/[^\w .-]/g, "").trim().slice(0, 60) || "kiosk";
    if (!kind || !status) return Response.json({ error: "kind and status are required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const at = new Date().toISOString();
    const patch = kind === "camera" ? { camera_status: status, camera_checked_at: at } : { microphone_status: status, microphone_checked_at: at };

    const existing = (await db.KioskDevice.filter({ device_name: device }, { limit: 1 }))?.items?.[0];
    if (existing) {
      // Write at most once a minute per device unless the status changed.
      const lastAt = existing[`${kind}_checked_at`];
      const same = existing[`${kind}_status`] === status;
      if (same && lastAt && Date.now() - new Date(lastAt).getTime() < 60 * 1000) return Response.json({ ok: true });
      await db.KioskDevice.update(existing.id, patch);
    } else {
      const count = (await db.KioskDevice.filter({}, { limit: 51 }))?.items?.length ?? 0;
      if (count >= 50) return Response.json({ error: "Too many kiosks registered" }, { status: 429 });
      await db.KioskDevice.create({ device_name: device, ...patch });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
