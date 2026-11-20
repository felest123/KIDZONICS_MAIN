import { base44 } from "@/api/base44Client";
import { moduleItems } from "@/lib/curriculum";

// Progress map states are derived from stored LessonProgress records.
// Rule: completed lessons stay completed, the first unfinished lesson is the
// glowing "current" task, everything after it is locked.
export function buildMap(moduleId, records = []) {
  const items = moduleItems(moduleId);
  const byKey = new Map(
    records
      .filter((r) => r.module === moduleId)
      .map((r) => [String(r.lesson_key).toUpperCase(), r])
  );
  let currentAssigned = false;
  return items.map((item) => {
    const record = byKey.get(item.key) || null;
    let state = "locked";
    if (record?.status === "completed") {
      state = "completed";
    } else if (!currentAssigned) {
      state = "current";
      currentAssigned = true;
    }
    return {
      ...item,
      state,
      accuracy: record?.best_accuracy ?? 0,
      attempts: record?.attempts ?? 0,
      stars: record?.stars ?? null,
      record,
    };
  });
}

export function completedCount(map) {
  return map.filter((node) => node.state === "completed").length;
}

export function starsFor(accuracy = 0) {
  if (accuracy >= 90) return 3;
  if (accuracy >= 75) return 2;
  if (accuracy >= 60) return 1;
  return 0;
}

export async function loadStudentProgress(studentId) {
  if (!studentId) return [];
  const page = await base44.entities.LessonProgress.filter(
    { student_id: studentId },
    { limit: 200, sort: "-created_date" }
  );
  return page?.items ?? [];
}

export async function recordResult({ student, moduleId, lessonKey, accuracy, passed, stars = 0 }) {
  if (!student?.id) return null;
  const page = await base44.entities.LessonProgress.filter(
    { student_id: student.id, module: moduleId, lesson_key: lessonKey },
    { limit: 1 }
  );
  const existing = page?.items?.[0];
  const attempts = (existing?.attempts ?? 0) + 1;
  const best = Math.max(existing?.best_accuracy ?? 0, Math.round(accuracy));
  const earned = passed ? Math.round(stars) : 0;
  const bestStars = Math.max(existing?.stars ?? 0, earned);
  const status = passed || existing?.status === "completed" ? "completed" : "current";

  if (existing) {
    await base44.entities.LessonProgress.update(existing.id, {
      attempts,
      best_accuracy: best,
      stars: bestStars,
      status,
    });
    return { ...existing, attempts, best_accuracy: best, stars: bestStars, status };
  }

  return base44.entities.LessonProgress.create({
    student_id: student.id,
    student_name: student.name,
    module: moduleId,
    lesson_key: lessonKey,
    status,
    attempts,
    best_accuracy: best,
    stars: bestStars,
  });
}

export async function saveAssessment({ student, moduleId, lessonKey, target, trial, accuracy, transcript, feedback, passed }) {
  if (!student?.id) return null;
  return base44.entities.Assessment.create({
    student_id: student.id,
    student_name: student.name,
    module: moduleId,
    lesson_key: lessonKey,
    target,
    trial,
    accuracy,
    transcript: transcript || "",
    feedback: feedback || "",
    passed,
  });
}

export function readKioskStudent() {
  try {
    const raw = sessionStorage.getItem("kidz.student");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setKioskStudent(student) {
  sessionStorage.setItem("kidz.student", JSON.stringify(student));
}

export function clearKioskStudent() {
  sessionStorage.removeItem("kidz.student");
}
