// KidZonics Admin API — the only door between the separate
// "KIDZONICS ADMIN – SYSTEM MANAGEMENT" application and this app's data.
//
// Who can call it: only the Admin application's backend. Every request is
// signed with ADMIN_API_SECRET (a Base44 secret set in BOTH apps, never sent
// to a browser):
//   x-kz-timestamp: unix seconds (must be within 5 minutes)
//   x-kz-nonce:     random one-time id (each id is accepted once)
//   x-kz-signature: hex HMAC-SHA256(secret, `${timestamp}.${nonce}.${rawBody}`)
// The Admin app verifies the administrator's login and ADMIN role before it
// signs, and passes who they are as body.actor for the activity log.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";

const MAX_SKEW_SECONDS = 300;
const READER_WINDOW_MS = 90 * 1000;
const TAP_WINDOW_MS = 60 * 1000;
const AI_OK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Targets the pronunciation checker can score (keep in sync with assessPronunciation).
const ASSESSABLE_TARGETS = ["A", "E", "I", "O", "U", "CAT", "BAT", "HEN", "PIN", "DOG", "SUN"];

const CATEGORIES = ["rfid_card", "account", "student_record", "ai_agent", "lesson_request", "technical", "other"];
const REQUEST_STATUSES = ["pending", "in_progress", "resolved"];
const LESSON_STATUSES = ["draft", "published", "archived"];
const ENROLLMENT = ["active", "inactive", "transferred"];
const DEVICE_STATES = ["ok", "blocked", "unavailable", "unknown"];

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}

// ---------------------------------------------------------------- helpers

const now = () => new Date().toISOString();
const ageMs = (iso?: string) => (iso ? Date.now() - new Date(iso).getTime() : Infinity);

function text(value: unknown, max = 400): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function email(value: unknown): string {
  const v = text(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : "";
}
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback?: T): T {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T;
  if (fallback !== undefined) return fallback;
  return fail(400, `Value must be one of: ${allowed.join(", ")}`);
}
function textList(value: unknown, maxItems = 20): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => text(v, 80)).filter(Boolean))].slice(0, maxItems);
}
function clampNumber(value: unknown, min: number, max: number): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
}
const items = (page: any): any[] => page?.items ?? (Array.isArray(page) ? page : []);

async function all(entity: any, query: Record<string, unknown> = {}, sort = "-created_date", cap = 2000) {
  const out: any[] = [];
  let skip = 0;
  while (out.length < cap) {
    const page = items(await entity.filter(query, { sort, limit: 200, skip }));
    out.push(...page);
    if (page.length < 200) break;
    skip += 200;
  }
  return out;
}

async function getOrNull(entity: any, id: string) {
  if (!id) return null;
  return entity.get(id).catch((e: any) => (e?.status === 404 ? null : Promise.reject(e)));
}

function hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const fingerprint = (hash: string) => (hash ? `•••• ${hash.slice(0, 6).toUpperCase()}` : "");

// ---------------------------------------------------------------- auth

async function verifyRequest(req: Request, raw: string, db: any) {
  let secret = "";
  try {
    secret = secrets.get("ADMIN_API_SECRET") || "";
  } catch {
    secret = "";
  }
  if (secret.length < 32) fail(503, "ADMIN_API_SECRET is not configured on the main app (min 32 characters).");

  const ts = req.headers.get("x-kz-timestamp") || "";
  const nonce = req.headers.get("x-kz-nonce") || "";
  const signature = (req.headers.get("x-kz-signature") || "").toLowerCase();
  if (!/^\d{9,12}$/.test(ts) || !/^[A-Za-z0-9_-]{16,80}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) {
    fail(401, "Missing or malformed signature");
  }
  if (Math.abs(Date.now() / 1000 - Number(ts)) > MAX_SKEW_SECONDS) fail(401, "Request expired");

  const expected = await hmac(secret, `${ts}.${nonce}.${raw}`);
  if (!safeEqual(expected, signature)) fail(401, "Bad signature");

  const seen = items(await db.ApiNonce.filter({ nonce }, { limit: 1 }));
  if (seen.length) fail(401, "Request already used");
  await db.ApiNonce.create({ nonce, used_at: now() });
  // Housekeeping: nonces older than the allowed clock skew can never be replayed.
  const cutoff = new Date(Date.now() - 2 * MAX_SKEW_SECONDS * 1000).toISOString();
  db.ApiNonce.deleteMany({ created_date: { $lt: cutoff } }).catch(() => {});
}

// ---------------------------------------------------------------- domain

async function log(db: any, actor: any, action: string, target: { type: string; id?: string; label?: string }, details: any = {}) {
  await db.AdminActivityLog.create({
    admin_email: actor.email,
    admin_name: actor.name || "",
    action,
    target_type: target.type,
    target_id: target.id || "",
    target_label: target.label || "",
    details: JSON.stringify(details).slice(0, 4000),
  });
}

async function config(db: any, key: "ai_agent" | "school") {
  const found = items(await db.SystemConfig.filter({ key }, { limit: 1 }))[0];
  if (found) return found;
  const defaults =
    key === "ai_agent"
      ? { key, assessment_enabled: true, agent_name: "", voice_name: "", speaking_rate: 0.82, language: "en-US", pass_threshold: 65 }
      : { key, school_name: "", support_contact: "" };
  return db.SystemConfig.create(defaults);
}

function aiStatus(cfg: any) {
  if (cfg.assessment_enabled === false) return "temporarily_disabled";
  if (!cfg.last_ok_at && !cfg.last_error_at) return "configuration_required";
  const lastOk = ageMs(cfg.last_ok_at);
  const lastErr = ageMs(cfg.last_error_at);
  if (lastErr < lastOk) return "disconnected"; // most recent real call failed
  return lastOk < AI_OK_WINDOW_MS ? "connected" : "configuration_required";
}

async function readerStatus(db: any) {
  const taps = items(await db.RfidTap.filter({}, { sort: "-created_date", limit: 50 }));
  const devices = new Map<string, string>();
  for (const tap of taps) if (!devices.has(tap.device || "kiosk")) devices.set(tap.device || "kiosk", tap.created_date);
  const list = [...devices].map(([device, last_seen]) => ({
    device,
    last_seen,
    connected: ageMs(last_seen) < READER_WINDOW_MS,
  }));
  return { connected: list.some((d) => d.connected), devices: list };
}

async function teacherDirectory(db: any) {
  const [users, profiles, students, cards] = await Promise.all([
    all(db.User, {}),
    all(db.TeacherProfile, {}),
    all(db.Student, {}, "name"),
    all(db.TeacherCard, { active: true }),
  ]);
  const byEmail = new Map<string, any>();
  for (const u of users) {
    if (u.role === "admin") continue; // main-app admins are not teachers
    const key = String(u.email || "").toLowerCase();
    if (key) byEmail.set(key, { email: key, full_name: u.full_name || "", user_id: u.id, joined: u.created_date });
  }
  for (const p of profiles) {
    const key = String(p.email).toLowerCase();
    byEmail.set(key, { ...(byEmail.get(key) || { email: key }), profile: p });
  }
  return [...byEmail.values()].map((t) => {
    const mine = students.filter((s) => String(s.advisory_teacher_email || "").toLowerCase() === t.email);
    const card = cards.find((c) => String(c.teacher_email).toLowerCase() === t.email);
    return {
      email: t.email,
      full_name: t.profile?.full_name || t.full_name || "",
      phone: t.profile?.phone || "",
      employee_id: t.profile?.employee_id || "",
      advisory_sections: t.profile?.advisory_sections || [...new Set(mine.map((s) => s.section).filter(Boolean))],
      status: t.profile?.status || (t.user_id ? "active" : "invited"),
      has_account: Boolean(t.user_id),
      joined: t.joined || t.profile?.created_date || "",
      student_count: mine.length,
      sned_count: mine.filter((s) => s.special_needs).length,
      rfid: card ? { card_id: card.id, label: card.label || "", fingerprint: fingerprint(card.card_hash), updated: card.updated_date || card.created_date } : null,
    };
  });
}

async function profileFor(db: any, teacherEmail: string) {
  const found = items(await db.TeacherProfile.filter({ email: teacherEmail }, { limit: 1 }))[0];
  if (found) return found;
  const user = items(await db.User.filter({ email: teacherEmail }, { limit: 1 }))[0];
  return db.TeacherProfile.create({ email: teacherEmail, full_name: user?.full_name || "", status: "active", advisory_sections: [] });
}

async function requireTeacher(db: any, teacherEmail: string) {
  const directory = await teacherDirectory(db);
  return directory.find((t) => t.email === teacherEmail) || fail(404, "Teacher not found");
}

function publicStudent(s: any) {
  const { photo_uri: _photo, ...rest } = s;
  return { ...rest, has_photo: Boolean(s.photo_uri) };
}

// ---------------------------------------------------------------- actions

type Ctx = { db: any; base44: any; actor: { email: string; name: string }; p: any };

const ACTIONS: Record<string, (ctx: Ctx) => Promise<unknown>> = {
  // ----- dashboard
  async "overview"({ db }) {
    const [students, teachers, lessons, requests, logs, ai, reader] = await Promise.all([
      all(db.Student, {}, "-created_date"),
      teacherDirectory(db),
      all(db.LessonPlan, { library: true }),
      all(db.SupportRequest, {}, "-created_date"),
      items(await db.AdminActivityLog.filter({}, { sort: "-created_date", limit: 8 })),
      config(db, "ai_agent"),
      readerStatus(db),
    ]);
    const activeTeachers = teachers.filter((t) => t.status !== "deactivated");
    return {
      totals: {
        students: students.filter((s) => (s.enrollment_status || "active") === "active").length,
        students_all: students.length,
        teachers: activeTeachers.length,
        sned: students.filter((s) => s.special_needs && (s.enrollment_status || "active") === "active").length,
        active_lessons: lessons.filter((l) => l.status === "published").length,
        pending_requests: requests.filter((r) => r.status !== "resolved").length,
      },
      ai_status: aiStatus(ai),
      rfid: reader,
      recent_teachers: [...teachers].sort((a, b) => String(b.joined).localeCompare(String(a.joined))).slice(0, 5),
      recent_students: students.slice(0, 5).map((s) => ({ id: s.id, name: s.name, section: s.section, created_date: s.created_date })),
      recent_activity: logs,
      pending_requests: requests.filter((r) => r.status !== "resolved").slice(0, 5)
        .map((r) => ({ id: r.id, subject: r.subject, teacher_name: r.teacher_name, category: r.category, status: r.status, created_date: r.created_date })),
    };
  },

  // ----- teachers
  async "teachers.list"({ db }) {
    return { teachers: await teacherDirectory(db) };
  },
  async "teachers.get"({ db, p }) {
    const teacherEmail = email(p.email) || fail(400, "email is required");
    const teacher = await requireTeacher(db, teacherEmail);
    const students = await all(db.Student, { advisory_teacher_email: teacherEmail }, "name");
    const cards = await all(db.TeacherCard, { teacher_email: teacherEmail }, "-created_date");
    return {
      teacher,
      students: students.map(publicStudent),
      cards: cards.map((c) => ({ id: c.id, label: c.label, active: c.active, fingerprint: fingerprint(c.card_hash), created_date: c.created_date, deactivated_at: c.deactivated_at || "", deactivated_reason: c.deactivated_reason || "" })),
    };
  },
  async "teachers.invite"({ db, base44, actor, p }) {
    const teacherEmail = email(p.email) || fail(400, "A valid email is required");
    const fullName = text(p.full_name, 120) || fail(400, "Full name is required");
    const existing = items(await db.TeacherProfile.filter({ email: teacherEmail }, { limit: 1 }))[0];
    if (existing) fail(409, "A teacher with this email already exists");
    const user = items(await db.User.filter({ email: teacherEmail }, { limit: 1 }))[0];
    if (user?.role === "admin") fail(409, "This email belongs to an administrator account");
    // Base44 only lets a signed-in user send invitations, and this API is called
    // server-to-server, so the account itself is created by the teacher signing
    // up with this email (or by an invitation from the Base44 dashboard). The
    // profile switches to "active" the first time they sign in.
    const profile = await db.TeacherProfile.create({
      email: teacherEmail,
      full_name: fullName,
      phone: text(p.phone, 40),
      employee_id: text(p.employee_id, 40),
      advisory_sections: textList(p.advisory_sections),
      status: user ? "active" : "invited",
    });
    await log(db, actor, "teacher.created", { type: "teacher", id: teacherEmail, label: fullName }, { has_account: Boolean(user), sections: profile.advisory_sections });
    return { teacher: profile, has_account: Boolean(user) };
  },
  async "teachers.update"({ db, actor, p }) {
    const teacherEmail = email(p.email) || fail(400, "email is required");
    await requireTeacher(db, teacherEmail);
    const profile = await profileFor(db, teacherEmail);
    const patch: Record<string, unknown> = {};
    if (p.full_name !== undefined) patch.full_name = text(p.full_name, 120) || fail(400, "Full name cannot be empty");
    if (p.phone !== undefined) patch.phone = text(p.phone, 40);
    if (p.employee_id !== undefined) patch.employee_id = text(p.employee_id, 40);
    if (p.advisory_sections !== undefined) patch.advisory_sections = textList(p.advisory_sections);
    const updated = await db.TeacherProfile.update(profile.id, patch);
    if (patch.full_name && patch.full_name !== profile.full_name) {
      // Keep the cached advisory name on students in step (no new student records).
      await db.Student.updateMany({ advisory_teacher_email: teacherEmail }, { $set: { advisory_teacher_name: patch.full_name } });
    }
    await log(db, actor, "teacher.updated", { type: "teacher", id: teacherEmail, label: updated.full_name },
      { before: { full_name: profile.full_name, phone: profile.phone, advisory_sections: profile.advisory_sections }, after: patch });
    return { teacher: updated };
  },
  async "teachers.setStatus"({ db, actor, p }) {
    const teacherEmail = email(p.email) || fail(400, "email is required");
    const next = oneOf(p.status, ["active", "deactivated"] as const);
    await requireTeacher(db, teacherEmail);
    const profile = await profileFor(db, teacherEmail);
    if (profile.status === next) return { teacher: profile };
    const patch = next === "deactivated"
      ? { status: next, deactivated_at: now(), deactivated_reason: text(p.reason, 300) }
      : { status: next, deactivated_at: "", deactivated_reason: "" };
    const updated = await db.TeacherProfile.update(profile.id, patch);
    if (next === "deactivated") {
      // A deactivated teacher's card must not open the sign-in screen. Students and records stay untouched.
      await db.TeacherCard.updateMany({ teacher_email: teacherEmail, active: true },
        { $set: { active: false, deactivated_at: now(), deactivated_by: actor.email, deactivated_reason: "Teacher account deactivated" } });
    }
    await log(db, actor, next === "deactivated" ? "teacher.deactivated" : "teacher.reactivated",
      { type: "teacher", id: teacherEmail, label: updated.full_name }, { reason: patch.deactivated_reason || "" });
    return { teacher: updated };
  },
  async "teachers.resetPassword"({ base44, db, actor, p }) {
    const teacherEmail = email(p.email) || fail(400, "email is required");
    const teacher = await requireTeacher(db, teacherEmail);
    if (!teacher.has_account) fail(409, "This teacher has not signed up yet, so there is no password to reset.");
    await base44.auth.resetPasswordRequest(teacherEmail); // Base44 emails a reset link; we never see the password
    await log(db, actor, "teacher.password_reset_sent", { type: "teacher", id: teacherEmail, label: teacher.full_name });
    return { sent: true };
  },

  // ----- students
  async "students.list"({ db, p }) {
    const query: Record<string, unknown> = {};
    if (text(p.section)) query.section = text(p.section);
    if (p.sned === true) query.special_needs = true;
    if (email(p.teacher)) query.advisory_teacher_email = email(p.teacher);
    let students = await all(db.Student, query, "name");
    const q = text(p.search, 80).toLowerCase();
    if (q) students = students.filter((s) => `${s.name} ${s.student_id || ""}`.toLowerCase().includes(q));
    const sections = [...new Set((await all(db.Student, {}, "section")).map((s) => s.section).filter(Boolean))].sort();
    return { students: students.map(publicStudent), sections };
  },
  async "students.get"({ db, p }) {
    const student = (await getOrNull(db.Student, text(p.id, 64))) || fail(404, "Student not found");
    const [progress, assessments] = await Promise.all([
      all(db.LessonProgress, { student_id: student.id }, "-updated_date", 400),
      all(db.Assessment, { student_id: student.id }, "-created_date", 400),
    ]);
    return { student: publicStudent(student), progress, assessments };
  },
  async "students.update"({ db, actor, p }) {
    const student = (await getOrNull(db.Student, text(p.id, 64))) || fail(404, "Student not found");
    const s = p.student || {};
    const patch: Record<string, unknown> = {};
    for (const f of ["student_id", "first_name", "middle_name", "last_name", "guardian_name", "guardian_phone", "notes"]) {
      if (s[f] !== undefined) patch[f] = text(s[f], 400);
    }
    if (s.guardian_email !== undefined) patch.guardian_email = s.guardian_email ? email(s.guardian_email) || fail(400, "Guardian email is not valid") : "";
    if (s.name !== undefined) patch.name = text(s.name, 160) || fail(400, "Name cannot be empty");
    if (s.section !== undefined) patch.section = text(s.section, 80) || fail(400, "Section cannot be empty");
    if (s.special_needs !== undefined) patch.special_needs = Boolean(s.special_needs);
    if (s.enrollment_status !== undefined) patch.enrollment_status = oneOf(s.enrollment_status, ENROLLMENT);
    if (!Object.keys(patch).length) fail(400, "Nothing to change");
    const before = Object.fromEntries(Object.keys(patch).map((k) => [k, student[k]]));
    const updated = await db.Student.update(student.id, patch);
    await log(db, actor, "student.updated", { type: "student", id: student.id, label: updated.name }, { before, after: patch });
    return { student: publicStudent(updated) };
  },
  async "students.transfer"({ db, actor, p }) {
    const student = (await getOrNull(db.Student, text(p.id, 64))) || fail(404, "Student not found");
    const teacherEmail = email(p.teacher_email) || fail(400, "teacher_email is required");
    const teacher = await requireTeacher(db, teacherEmail);
    if (teacher.status === "deactivated") fail(409, "Cannot transfer a student to a deactivated teacher");
    const before = { teacher: student.advisory_teacher_email || "", section: student.section };
    const patch: Record<string, unknown> = { advisory_teacher_email: teacherEmail, advisory_teacher_name: teacher.full_name };
    if (text(p.section, 80)) patch.section = text(p.section, 80);
    const updated = await db.Student.update(student.id, patch); // same record: progress and assessments stay linked
    await log(db, actor, "student.transferred", { type: "student", id: student.id, label: student.name }, { before, after: { teacher: teacherEmail, section: updated.section } });
    return { student: publicStudent(updated) };
  },
  async "students.photo"({ base44, db, p }) {
    const student = (await getOrNull(db.Student, text(p.id, 64))) || fail(404, "Student not found");
    if (!student.photo_uri) return { url: "" };
    const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: student.photo_uri, expires_in: 300 });
    return { url: signed?.signed_url || "" };
  },

  // ----- RFID
  async "rfid.list"({ db }) {
    const [cards, teachers, reader] = await Promise.all([all(db.TeacherCard, {}, "-updated_date"), teacherDirectory(db), readerStatus(db)]);
    const names = new Map(teachers.map((t) => [t.email, t.full_name]));
    return {
      reader,
      cards: cards.map((c) => ({
        id: c.id, teacher_email: c.teacher_email, teacher_name: names.get(String(c.teacher_email).toLowerCase()) || c.teacher_name || "",
        label: c.label || "", active: Boolean(c.active), fingerprint: fingerprint(c.card_hash),
        registered_by: c.registered_by || "", created_date: c.created_date, updated_date: c.updated_date || c.created_date,
        deactivated_at: c.deactivated_at || "", deactivated_reason: c.deactivated_reason || "",
      })),
      teachers: teachers.map((t) => ({ email: t.email, full_name: t.full_name, status: t.status, rfid: t.rfid })),
    };
  },
  async "rfid.pendingTap"({ db }) {
    const reader = await readerStatus(db);
    const taps = items(await db.RfidTap.filter({ consumed: false }, { sort: "-created_date", limit: 10 }));
    const tap = taps.find((t) => t.status !== "heartbeat" && ageMs(t.created_date) < TAP_WINDOW_MS);
    if (!tap) return { reader, tap: null };
    const owner = items(await db.TeacherCard.filter({ card_hash: tap.card_hash, active: true }, { limit: 1 }))[0];
    return {
      reader,
      tap: { tap_id: tap.id, fingerprint: fingerprint(tap.card_hash), device: tap.device || "", at: tap.created_date, linked_to: owner ? owner.teacher_email : "" },
    };
  },
  async "rfid.register"({ db, actor, p }) {
    // Steps 3–6 of the replacement workflow: verify the tapped card, deactivate the old one, save the new link.
    const teacherEmail = email(p.teacher_email) || fail(400, "teacher_email is required");
    const teacher = await requireTeacher(db, teacherEmail);
    if (teacher.status === "deactivated") fail(409, "Reactivate the teacher before registering a card");
    const tap = (await getOrNull(db.RfidTap, text(p.tap_id, 64))) || fail(404, "That tap has expired. Tap the card again.");
    if (tap.consumed) fail(409, "That tap was already used. Tap the card again.");
    if (tap.status === "heartbeat") fail(400, "No card detected");
    if (ageMs(tap.created_date) > TAP_WINDOW_MS) fail(410, "That tap has expired. Tap the card again.");

    const owners = items(await db.TeacherCard.filter({ card_hash: tap.card_hash, active: true }, { limit: 5 }));
    if (owners.some((c) => String(c.teacher_email).toLowerCase() !== teacherEmail)) {
      await db.RfidTap.update(tap.id, { consumed: true });
      fail(409, "This card is already active for another teacher. Deactivate it there first.");
    }
    const previous = items(await db.TeacherCard.filter({ teacher_email: teacherEmail, active: true }, { limit: 5 }));
    const sameCard = previous.find((c) => c.card_hash === tap.card_hash);
    await db.RfidTap.update(tap.id, { consumed: true });
    if (sameCard) return { card: { id: sameCard.id, fingerprint: fingerprint(sameCard.card_hash) }, unchanged: true };

    for (const card of previous) {
      await db.TeacherCard.update(card.id, { active: false, deactivated_at: now(), deactivated_by: actor.email, deactivated_reason: "Replaced by a new card" });
    }
    const card = await db.TeacherCard.create({
      teacher_email: teacherEmail, teacher_name: teacher.full_name, card_hash: tap.card_hash,
      label: text(p.label, 60) || "Teacher card", active: true, registered_by: actor.email,
    });
    await log(db, actor, previous.length ? "rfid.replaced" : "rfid.registered",
      { type: "rfid_card", id: card.id, label: `${teacher.full_name} · ${fingerprint(card.card_hash)}` },
      { teacher: teacherEmail, replaced: previous.map((c) => fingerprint(c.card_hash)) });
    return { card: { id: card.id, fingerprint: fingerprint(card.card_hash) }, replaced: previous.length };
  },
  async "rfid.deactivate"({ db, actor, p }) {
    const card = (await getOrNull(db.TeacherCard, text(p.card_id, 64))) || fail(404, "Card not found");
    if (!card.active) return { card: { id: card.id, active: false } };
    const reason = text(p.reason, 200) || "Deactivated by administrator";
    await db.TeacherCard.update(card.id, { active: false, deactivated_at: now(), deactivated_by: actor.email, deactivated_reason: reason });
    await log(db, actor, "rfid.deactivated", { type: "rfid_card", id: card.id, label: `${card.teacher_name || card.teacher_email} · ${fingerprint(card.card_hash)}` }, { reason });
    return { card: { id: card.id, active: false } };
  },

  // ----- AI agent
  async "ai.get"({ db }) {
    const cfg = await config(db, "ai_agent");
    const devices = await all(db.KioskDevice, {}, "-updated_date", 50);
    return { config: cfg, status: aiStatus(cfg), devices, assessable_targets: ASSESSABLE_TARGETS };
  },
  async "ai.update"({ db, actor, p }) {
    const cfg = await config(db, "ai_agent");
    const s = p.config || {};
    const patch: Record<string, unknown> = { updated_by: actor.email };
    if (s.assessment_enabled !== undefined) patch.assessment_enabled = Boolean(s.assessment_enabled);
    if (s.agent_name !== undefined) patch.agent_name = text(s.agent_name, 60);
    if (s.agent_avatar !== undefined) patch.agent_avatar = text(s.agent_avatar, 500);
    if (s.voice_name !== undefined) patch.voice_name = text(s.voice_name, 120);
    if (s.language !== undefined) patch.language = oneOf(s.language, ["en-US", "en-GB", "en-PH", "fil-PH"] as const);
    if (s.speaking_rate !== undefined) patch.speaking_rate = clampNumber(s.speaking_rate, 0.5, 1.3) ?? fail(400, "speaking_rate must be a number");
    if (s.pass_threshold !== undefined) patch.pass_threshold = clampNumber(s.pass_threshold, 40, 95) ?? fail(400, "pass_threshold must be a number");
    if (s.audio_instructions !== undefined) patch.audio_instructions = text(s.audio_instructions, 600);
    const before = Object.fromEntries(Object.keys(patch).filter((k) => k !== "updated_by").map((k) => [k, cfg[k]]));
    const updated = await db.SystemConfig.update(cfg.id, patch);
    await log(db, actor, "ai.settings_changed", { type: "system_config", id: cfg.id, label: "AI Agent" }, { before, after: patch });
    return { config: updated, status: aiStatus(updated) };
  },

  // ----- lessons
  async "lessons.list"({ db, p }) {
    const query: Record<string, unknown> = { library: true };
    if (p.status) query.status = oneOf(p.status, LESSON_STATUSES);
    const [lessons, assignments] = await Promise.all([all(db.LessonPlan, query, "-updated_date"), all(db.LessonAssignment, { active: true })]);
    return {
      lessons: lessons.map((l) => ({ ...l, assignment_count: assignments.filter((a) => a.lesson_id === l.id).length })),
      assessable_targets: ASSESSABLE_TARGETS,
    };
  },
  async "lessons.save"({ db, actor, p }) {
    const s = p.lesson || {};
    const data: Record<string, unknown> = {
      title: text(s.title, 120) || fail(400, "Title is required"),
      description: text(s.description, 1000),
      category: oneOf(s.category, ["vowels", "cvc"] as const),
      target: text(s.target, 20).toUpperCase() || fail(400, "Target letter or word is required"),
      instructions: text(s.instructions, 1500),
      pronunciation_target: text(s.pronunciation_target, 40),
      assessment_instructions: text(s.assessment_instructions, 1500),
      updated_by: actor.email,
    };
    for (const f of ["demo_video_uri", "demo_audio_uri", "illustration_uri"]) {
      const v = text(s[f], 1000);
      if (v && !/^https:\/\//i.test(v)) fail(400, `${f} must be an https URL`);
      data[f] = v;
    }
    const id = text(p.id, 64);
    if (id) {
      const lesson = (await getOrNull(db.LessonPlan, id)) || fail(404, "Lesson not found");
      if (!lesson.library) fail(400, "Only library lessons can be edited here");
      // Changing the target means the AI agent must be prepared again.
      if (data.target !== lesson.target) Object.assign(data, { ai_prepared: false, ai_status: "not_prepared" });
      const updated = await db.LessonPlan.update(id, data);
      await log(db, actor, "lesson.updated", { type: "lesson", id, label: updated.title });
      return { lesson: updated };
    }
    const created = await db.LessonPlan.create({ ...data, library: true, status: "draft", audience: "all", ai_prepared: false, ai_status: "not_prepared" });
    await log(db, actor, "lesson.created", { type: "lesson", id: created.id, label: created.title });
    return { lesson: created };
  },
  async "lessons.setStatus"({ db, actor, p }) {
    const lesson = (await getOrNull(db.LessonPlan, text(p.id, 64))) || fail(404, "Lesson not found");
    if (!lesson.library) fail(400, "Only library lessons can be published");
    const next = oneOf(p.status, LESSON_STATUSES);
    if (lesson.status === next) return { lesson };
    const patch: Record<string, unknown> = { status: next, updated_by: actor.email };
    if (next === "published") patch.published_at = now();
    if (next === "archived") patch.archived_at = now();
    const updated = await db.LessonPlan.update(lesson.id, patch);
    const action = next === "published" ? "lesson.published" : next === "archived" ? "lesson.archived" : "lesson.unpublished";
    await log(db, actor, action, { type: "lesson", id: lesson.id, label: lesson.title }, { from: lesson.status || "draft", to: next });
    return { lesson: updated };
  },
  async "lessons.sendToAgent"({ db, actor, p }) {
    const lesson = (await getOrNull(db.LessonPlan, text(p.id, 64))) || fail(404, "Lesson not found");
    const target = String(lesson.pronunciation_target || lesson.target || "").toUpperCase();
    // "connected" only when the pronunciation checker can actually score this target.
    const supported = ASSESSABLE_TARGETS.includes(target);
    const updated = await db.LessonPlan.update(lesson.id, { ai_prepared: true, ai_status: supported ? "connected" : "prepared" });
    await log(db, actor, "lesson.sent_to_agent", { type: "lesson", id: lesson.id, label: lesson.title }, { target, assessable: supported });
    return { lesson: updated, assessable: supported };
  },

  // ----- inbox
  async "inbox.list"({ db, p }) {
    const query: Record<string, unknown> = {};
    if (p.status) query.status = oneOf(p.status, REQUEST_STATUSES);
    if (p.category) query.category = oneOf(p.category, CATEGORIES);
    let requests = await all(db.SupportRequest, query, "-last_message_at");
    const q = text(p.search, 80).toLowerCase();
    if (q) requests = requests.filter((r) => `${r.subject} ${r.description} ${r.teacher_name} ${r.teacher_email}`.toLowerCase().includes(q));
    return { requests };
  },
  async "inbox.get"({ db, p }) {
    return { request: (await getOrNull(db.SupportRequest, text(p.id, 64))) || fail(404, "Request not found") };
  },
  async "inbox.reply"({ db, actor, p }) {
    const request = (await getOrNull(db.SupportRequest, text(p.id, 64))) || fail(404, "Request not found");
    const body = text(p.body, 4000) || fail(400, "Reply cannot be empty");
    const status = p.status ? oneOf(p.status, REQUEST_STATUSES) : request.status === "pending" ? "in_progress" : request.status;
    const at = now();
    const messages = [...(request.messages || []), { from: "admin", author_name: actor.name || "Administrator", body, sent_at: at }];
    const patch: Record<string, unknown> = { messages, status, last_message_at: at, last_message_from: "admin" };
    if (status === "resolved") patch.resolved_at = at;
    const updated = await db.SupportRequest.update(request.id, patch);
    await log(db, actor, status === "resolved" && request.status !== "resolved" ? "request.resolved" : "request.replied",
      { type: "support_request", id: request.id, label: request.subject }, { teacher: request.teacher_email, status });
    return { request: updated };
  },
  async "inbox.setStatus"({ db, actor, p }) {
    const request = (await getOrNull(db.SupportRequest, text(p.id, 64))) || fail(404, "Request not found");
    const status = oneOf(p.status, REQUEST_STATUSES);
    if (status === request.status) return { request };
    const updated = await db.SupportRequest.update(request.id, { status, resolved_at: status === "resolved" ? now() : "" });
    await log(db, actor, status === "resolved" ? "request.resolved" : "request.status_changed",
      { type: "support_request", id: request.id, label: request.subject }, { from: request.status, to: status });
    return { request: updated };
  },

  // ----- reports & monitoring
  async "reports.summary"({ db }) {
    const [students, progress, assessments, teachers] = await Promise.all([
      all(db.Student, {}, "name"), all(db.LessonProgress, {}, "-updated_date", 5000),
      all(db.Assessment, {}, "-created_date", 5000), teacherDirectory(db),
    ]);
    const active = students.filter((s) => (s.enrollment_status || "active") === "active");
    const sections = [...new Set(active.map((s) => s.section || "—"))].sort().map((section) => {
      const ids = new Set(active.filter((s) => (s.section || "—") === section).map((s) => s.id));
      const done = progress.filter((r) => ids.has(r.student_id) && r.status === "completed");
      const tries = assessments.filter((a) => ids.has(a.student_id));
      return {
        section,
        students: ids.size,
        sned: active.filter((s) => (s.section || "—") === section && s.special_needs).length,
        lessons_completed: done.length,
        vowels_completed: done.filter((r) => r.module === "vowels").length,
        cvc_completed: done.filter((r) => r.module === "cvc").length,
        assessments: tries.length,
        average_accuracy: tries.length ? Math.round(tries.reduce((a, t) => a + (t.accuracy || 0), 0) / tries.length) : null,
        pass_rate: tries.length ? Math.round((tries.filter((t) => t.passed).length / tries.length) * 100) : null,
      };
    });
    const byLesson = new Map<string, { module: string; lesson_key: string; tries: number; passed: number; total: number }>();
    for (const a of assessments) {
      const key = `${a.module}:${a.lesson_key}`;
      const row = byLesson.get(key) || { module: a.module, lesson_key: a.lesson_key, tries: 0, passed: 0, total: 0 };
      row.tries++; row.total += a.accuracy || 0; if (a.passed) row.passed++;
      byLesson.set(key, row);
    }
    return {
      generated_at: now(),
      totals: { students: active.length, sned: active.filter((s) => s.special_needs).length, teachers: teachers.filter((t) => t.status !== "deactivated").length, assessments: assessments.length },
      sections,
      lessons: [...byLesson.values()].map((r) => ({ module: r.module, lesson_key: r.lesson_key, tries: r.tries, average_accuracy: Math.round(r.total / r.tries), pass_rate: Math.round((r.passed / r.tries) * 100) })),
      teachers: teachers.map((t) => ({ email: t.email, full_name: t.full_name, status: t.status, students: t.student_count, sned: t.sned_count })),
    };
  },
  async "monitoring.status"({ db }) {
    const [ai, reader, devices, recent] = await Promise.all([
      config(db, "ai_agent"), readerStatus(db), all(db.KioskDevice, {}, "-updated_date", 50),
      items(await db.Assessment.filter({}, { sort: "-created_date", limit: 1 })),
    ]);
    return {
      checked_at: now(),
      admin_api: "connected", // this response itself proves the signed link works
      ai: { status: aiStatus(ai), last_ok_at: ai.last_ok_at || "", last_error_at: ai.last_error_at || "", last_error: ai.last_error || "" },
      rfid: reader,
      kiosks: devices.map((d) => ({
        device_name: d.device_name,
        camera: oneOf(d.camera_status, DEVICE_STATES, "unknown"), camera_checked_at: d.camera_checked_at || "",
        microphone: oneOf(d.microphone_status, DEVICE_STATES, "unknown"), microphone_checked_at: d.microphone_checked_at || "",
      })),
      last_assessment_at: recent[0]?.created_date || "",
    };
  },

  // ----- settings & logs
  async "settings.get"({ db }) {
    return { school: await config(db, "school") };
  },
  async "settings.update"({ db, actor, p }) {
    const cfg = await config(db, "school");
    const patch = { school_name: text(p.school_name, 120), support_contact: text(p.support_contact, 200), updated_by: actor.email };
    const updated = await db.SystemConfig.update(cfg.id, patch);
    await log(db, actor, "settings.changed", { type: "system_config", id: cfg.id, label: "School settings" },
      { before: { school_name: cfg.school_name, support_contact: cfg.support_contact }, after: patch });
    return { school: updated };
  },
  async "logs.list"({ db, p }) {
    const query: Record<string, unknown> = {};
    if (text(p.action, 60)) query.action = text(p.action, 60);
    if (email(p.admin)) query.admin_email = email(p.admin);
    const limit = clampNumber(p.limit, 1, 500) ?? 200;
    return { logs: items(await db.AdminActivityLog.filter(query, { sort: "-created_date", limit })) };
  },
};

export const ACTION_NAMES = Object.keys(ACTIONS);

export default async function (req: Request) {
  try {
    if (req.method !== "POST") fail(405, "POST only");
    const raw = await req.text();
    if (raw.length > 200_000) fail(413, "Request too large");
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    await verifyRequest(req, raw, db);

    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      fail(400, "Body must be JSON");
    }
    const action = text(body?.action, 60);
    const handler = Object.hasOwn(ACTIONS, action) ? ACTIONS[action] : null;
    if (!handler) fail(400, "Unknown action");
    const actor = { email: email(body?.actor?.email), name: text(body?.actor?.name, 120) };
    if (!actor.email) fail(400, "actor.email is required");

    const result = await handler({ db, base44, actor, p: body?.params && typeof body.params === "object" ? body.params : {} });
    return Response.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof ApiError) return Response.json({ ok: false, error: error.message }, { status: error.status });
    console.error("adminApi failed", error);
    return Response.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
