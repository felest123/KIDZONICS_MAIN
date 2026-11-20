import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Tells the Teacher Dashboard whether this account may be used.
// The status is managed from the separate Admin application.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const db = base44.asServiceRole.entities;
    const teacherEmail = String(user.email || "").toLowerCase();
    const page = await db.TeacherProfile.filter({ email: teacherEmail }, { limit: 1 });
    let profile = page?.items?.[0] || null;

    // An administrator added this teacher before they signed up: first sign-in activates it.
    if (profile?.status === "invited") {
      profile = await db.TeacherProfile.update(profile.id, { status: "active" });
    }

    return Response.json({
      status: profile?.status || "active",
      full_name: profile?.full_name || user.full_name || "",
      advisory_sections: profile?.advisory_sections || [],
      deactivated_reason: profile?.status === "deactivated" ? profile.deactivated_reason || "" : "",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
