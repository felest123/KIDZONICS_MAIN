import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Contact Administrator: teachers send requests to the separate Admin
// application through this shared backend. A teacher only ever sees their own.
const CATEGORIES = ["rfid_card", "account", "student_record", "ai_agent", "lesson_request", "technical", "other"];

const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function deactivated(db, teacherEmail) {
  const page = await db.TeacherProfile.filter({ email: teacherEmail }, { limit: 1 });
  return page?.items?.[0]?.status === "deactivated";
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const db = base44.asServiceRole.entities;
    const teacherEmail = String(user.email || "").toLowerCase();
    if (await deactivated(db, teacherEmail)) {
      return Response.json({ error: "This teacher account has been deactivated." }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const action = body.action || "list";

    if (action === "list") {
      const page = await db.SupportRequest.filter({ teacher_email: teacherEmail }, { sort: "-last_message_at", limit: 100 });
      return Response.json({ requests: page?.items ?? [] });
    }

    if (action === "create") {
      const subject = text(body.subject, 140);
      const description = text(body.description, 4000);
      const category = CATEGORIES.includes(body.category) ? body.category : "";
      if (!subject || !description || !category) {
        return Response.json({ error: "Subject, category and description are required." }, { status: 400 });
      }
      // Simple flood guard: at most 10 new requests per teacher per hour.
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recent = await db.SupportRequest.filter({ teacher_email: teacherEmail, created_date: { $gt: hourAgo } }, { limit: 11 });
      if ((recent?.items ?? []).length >= 10) {
        return Response.json({ error: "Too many requests in the last hour. Please wait a little." }, { status: 429 });
      }
      const at = new Date().toISOString();
      const request = await db.SupportRequest.create({
        teacher_email: teacherEmail,
        teacher_name: user.full_name || "",
        subject,
        category,
        description,
        status: "pending",
        messages: [],
        last_message_at: at,
        last_message_from: "teacher",
      });
      return Response.json({ request });
    }

    if (action === "followup") {
      const message = text(body.body, 4000);
      if (!message) return Response.json({ error: "Message cannot be empty." }, { status: 400 });
      const request = await db.SupportRequest.get(String(body.id || "")).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!request || String(request.teacher_email).toLowerCase() !== teacherEmail) {
        return Response.json({ error: "Request not found" }, { status: 404 });
      }
      const at = new Date().toISOString();
      const updated = await db.SupportRequest.update(request.id, {
        messages: [...(request.messages || []), { from: "teacher", author_name: user.full_name || "", body: message, sent_at: at }],
        last_message_at: at,
        last_message_from: "teacher",
        // A teacher writing again re-opens a resolved request.
        status: request.status === "resolved" ? "pending" : request.status,
      });
      return Response.json({ request: updated });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
