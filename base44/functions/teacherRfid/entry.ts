import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

const READER_WINDOW_MS = 90 * 1000;
const TAP_WINDOW_MS = 2 * 60 * 1000;
const ENROLL_WINDOW_MS = 60 * 1000;

// Accounts are deactivated from the separate Admin application.
async function isDeactivated(base44, user) {
  const page = await base44.asServiceRole.entities.TeacherProfile.filter(
    { email: String(user.email || "").toLowerCase() },
    { limit: 1 }
  );
  return page?.items?.[0]?.status === "deactivated";
}

function age(tap) {
  const at = new Date(tap.created_date || 0).getTime();
  return Date.now() - at;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    if (action === "status") {
      const page = await base44.asServiceRole.entities.RfidTap.filter({}, { sort: "-created_date", limit: 12 });
      const taps = page?.items ?? [];
      const readerConnected = taps.some((tap) => age(tap) < READER_WINDOW_MS);
      const pending = taps.find((tap) => !tap.consumed && tap.status !== "heartbeat" && age(tap) < TAP_WINDOW_MS);

      if (!pending) return Response.json({ reader_connected: readerConnected, tap: null });

      return Response.json({
        reader_connected: readerConnected,
        tap: {
          tap_id: pending.id,
          status: pending.status,
          teacher_name: pending.status === "authorized" ? pending.teacher_name || "" : "",
          teacher_email: pending.status === "authorized" ? pending.teacher_email || "" : "",
        },
      });
    }

    if (action === "consume") {
      const tapId = body.tap_id;
      if (!tapId) return Response.json({ error: "tap_id is required" }, { status: 400 });
      const tap = await base44.asServiceRole.entities.RfidTap.get(tapId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!tap) return Response.json({ error: "Tap expired" }, { status: 404 });
      if (tap.consumed) return Response.json({ error: "Tap already used" }, { status: 409 });
      if (age(tap) > TAP_WINDOW_MS) return Response.json({ error: "Tap expired" }, { status: 410 });

      await base44.asServiceRole.entities.RfidTap.update(tap.id, { consumed: true });

      if (tap.status !== "authorized" || !tap.teacher_email) {
        return Response.json({ status: "unknown" });
      }
      if (await isDeactivated(base44, { email: tap.teacher_email })) {
        return Response.json({ status: "unknown" });
      }
      return Response.json({
        status: "authorized",
        teacher_name: tap.teacher_name || "",
        teacher_email: tap.teacher_email,
      });
    }

    // Everything below requires a signed-in teacher.
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (await isDeactivated(base44, user)) {
      return Response.json({ error: "This teacher account has been deactivated." }, { status: 403 });
    }

    if (action === "card") {
      const page = await base44.asServiceRole.entities.TeacherCard.filter(
        { teacher_email: user.email, active: true },
        { limit: 1 }
      );
      const page2 = await base44.asServiceRole.entities.RfidTap.filter({}, { sort: "-created_date", limit: 12 });
      const readerConnected = (page2?.items ?? []).some((tap) => age(tap) < READER_WINDOW_MS);
      return Response.json({ linked: Boolean(page?.items?.length), reader_connected: readerConnected });
    }

    if (action === "enroll") {
      const tapId = body.tap_id;
      if (!tapId) return Response.json({ error: "tap_id is required" }, { status: 400 });
      const tap = await base44.asServiceRole.entities.RfidTap.get(tapId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!tap) return Response.json({ error: "Tap expired" }, { status: 404 });
      if (tap.consumed) return Response.json({ error: "Tap already used" }, { status: 409 });
      if (age(tap) > ENROLL_WINDOW_MS) return Response.json({ error: "Tap expired" }, { status: 410 });
      if (tap.status === "heartbeat") return Response.json({ error: "No card detected" }, { status: 400 });

      const existing = await base44.asServiceRole.entities.TeacherCard.filter(
        { card_hash: tap.card_hash, active: true },
        { limit: 5 }
      );
      const taken = (existing?.items ?? []).find((card) => card.teacher_email !== user.email);
      if (taken) {
        await base44.asServiceRole.entities.RfidTap.update(tap.id, { consumed: true });
        return Response.json({ error: "This card is already linked to another teacher." }, { status: 409 });
      }

      await base44.asServiceRole.entities.TeacherCard.updateMany(
        { teacher_email: user.email },
        { $set: { active: false } }
      );
      await base44.asServiceRole.entities.TeacherCard.create({
        teacher_email: user.email,
        teacher_name: user.full_name || "",
        card_hash: tap.card_hash,
        label: body.label ? String(body.label).slice(0, 60) : "Teacher card",
        active: true,
        registered_by: user.email,
      });
      await base44.asServiceRole.entities.RfidTap.update(tap.id, { consumed: true });
      return Response.json({ linked: true });
    }

    if (action === "unlink") {
      await base44.asServiceRole.entities.TeacherCard.updateMany(
        { teacher_email: user.email },
        { $set: { active: false } }
      );
      return Response.json({ linked: false });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
