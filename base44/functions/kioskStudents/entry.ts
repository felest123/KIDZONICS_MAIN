import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Public: the kiosk's "Who are you?" screen. Students never sign in, so this
// returns only what the name-and-section picker needs. Guardian details,
// notes, photos and student IDs stay private to the advisory teacher and admins.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const out = [];
    let skip = 0;
    while (out.length < 2000) {
      const page = await base44.asServiceRole.entities.Student.filter({}, { sort: "name", limit: 200, skip });
      const items = page?.items ?? [];
      out.push(...items);
      if (items.length < 200) break;
      skip += 200;
    }
    const students = out
      .filter((s) => (s.enrollment_status || "active") === "active")
      .map((s) => ({ id: s.id, name: s.name, section: s.section, special_needs: Boolean(s.special_needs), avatar: s.avatar || "" }));
    return Response.json({ students });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
