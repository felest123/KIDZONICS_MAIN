import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Teachers assign lessons from the central library. Only lessons an
// administrator has published can be assigned, and only to the teacher's
// own advisory students.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const db = base44.asServiceRole.entities;
    const teacherEmail = String(user.email || "").toLowerCase();
    const profile = (await db.TeacherProfile.filter({ email: teacherEmail }, { limit: 1 }))?.items?.[0];
    if (profile?.status === "deactivated") {
      return Response.json({ error: "This teacher account has been deactivated." }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const action = body.action || "list";

    if (action === "list") {
      const [library, assignments] = await Promise.all([
        db.LessonPlan.filter({ library: true, status: "published" }, { sort: "title", limit: 200 }),
        db.LessonAssignment.filter({ teacher_email: teacherEmail, active: true }, { sort: "-created_date", limit: 200 }),
      ]);
      return Response.json({ library: library?.items ?? [], assignments: assignments?.items ?? [] });
    }

    if (action === "assign") {
      const lesson = await db.LessonPlan.get(String(body.lesson_id || "")).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!lesson || !lesson.library || lesson.status !== "published") {
        return Response.json({ error: "Only published library lessons can be assigned." }, { status: 400 });
      }
      const audience = body.audience === "student" ? "student" : "all";
      let studentIds = [];
      let studentNames = [];
      if (audience === "student") {
        const ids = Array.isArray(body.student_ids) ? body.student_ids.map(String).slice(0, 50) : [];
        if (!ids.length) return Response.json({ error: "Choose at least one student." }, { status: 400 });
        const mine = (await db.Student.filter({ advisory_teacher_email: teacherEmail }, { limit: 500 }))?.items ?? [];
        const allowed = mine.filter((s) => ids.includes(s.id));
        if (allowed.length !== new Set(ids).size) {
          return Response.json({ error: "You can only assign lessons to your own advisory students." }, { status: 403 });
        }
        studentIds = allowed.map((s) => s.id);
        studentNames = allowed.map((s) => s.name);
      }
      const assignment = await db.LessonAssignment.create({
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        teacher_email: teacherEmail,
        teacher_name: user.full_name || "",
        audience,
        student_ids: studentIds,
        student_names: studentNames,
        active: true,
      });
      return Response.json({ assignment });
    }

    if (action === "unassign") {
      const assignment = await db.LessonAssignment.get(String(body.id || "")).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!assignment || String(assignment.teacher_email).toLowerCase() !== teacherEmail) {
        return Response.json({ error: "Assignment not found" }, { status: 404 });
      }
      await db.LessonAssignment.update(assignment.id, { active: false });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
