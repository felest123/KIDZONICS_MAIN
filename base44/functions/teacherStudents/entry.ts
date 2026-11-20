import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

const TEXT_FIELDS = [
  "student_id",
  "first_name",
  "middle_name",
  "last_name",
  "name",
  "section",
  "photo_uri",
  "guardian_name",
  "guardian_phone",
  "guardian_email",
  "notes",
  "enrollment_status",
];

function pickText(source = {}) {
  const out = {};
  for (const field of TEXT_FIELDS) {
    if (typeof source[field] === "string") out[field] = source[field].trim().slice(0, 400);
  }
  return out;
}

// Accounts are deactivated from the separate Admin application.
async function isDeactivated(base44, user) {
  const page = await base44.asServiceRole.entities.TeacherProfile.filter(
    { email: String(user.email || "").toLowerCase() },
    { limit: 1 }
  );
  return page?.items?.[0]?.status === "deactivated";
}

function isOwner(user, student) {
  if (!student.advisory_teacher_email) return true;
  return student.advisory_teacher_email === user.email || user.role === "admin";
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (await isDeactivated(base44, user)) {
      return Response.json({ error: "This teacher account has been deactivated." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "create";

    if (action === "create") {
      const data = pickText(body.student);
      if (!data.name || !data.section) {
        return Response.json({ error: "Name and section are required" }, { status: 400 });
      }
      const record = await base44.asServiceRole.entities.Student.create({
        ...data,
        special_needs: Boolean(body.student?.special_needs),
        advisory_teacher_email: user.email,
        advisory_teacher_name: user.full_name || "",
      });
      return Response.json({ student: record });
    }

    const studentId = body.student_id;
    if (!studentId) return Response.json({ error: "student_id is required" }, { status: 400 });

    const student = await base44.asServiceRole.entities.Student.get(studentId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!student) return Response.json({ error: "Student not found" }, { status: 404 });
    if (!isOwner(user, student)) {
      return Response.json({ error: "Only the advisory teacher can change this student." }, { status: 403 });
    }

    if (action === "toggle_sned") {
      const next = !student.special_needs;
      const patch = { special_needs: next };
      if (!student.advisory_teacher_email) {
        patch.advisory_teacher_email = user.email;
        patch.advisory_teacher_name = user.full_name || "";
      }
      const updated = await base44.asServiceRole.entities.Student.update(student.id, patch);
      return Response.json({ student: updated });
    }

    if (action === "update") {
      const data = pickText(body.student);
      if (!data.name || !data.section) {
        return Response.json({ error: "Name and section are required" }, { status: 400 });
      }
      const patch = { ...data };
      if (typeof body.student?.special_needs === "boolean") patch.special_needs = body.student.special_needs;
      if (!student.advisory_teacher_email) {
        patch.advisory_teacher_email = user.email;
        patch.advisory_teacher_name = user.full_name || "";
      }
      const updated = await base44.asServiceRole.entities.Student.update(student.id, patch);
      return Response.json({ student: updated });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
