import { buildMap, completedCount } from "@/lib/progress";

export function summarizeStudents(students, progress, assessments) {
  return students.map((student) => {
    const own = progress.filter((record) => record.student_id === student.id);
    const vowelMap = buildMap("vowels", own);
    const cvcMap = buildMap("cvc", own);
    const vowelDone = completedCount(vowelMap);
    const cvcDone = completedCount(cvcMap);
    const total = vowelMap.length + cvcMap.length;
    const done = vowelDone + cvcDone;
    const percent = Math.round((done / Math.max(total, 1)) * 100);
    const recent = assessments.filter((item) => item.student_id === student.id);
    const average = recent.length
      ? Math.round(recent.reduce((sum, item) => sum + (item.accuracy || 0), 0) / recent.length)
      : null;
    const stars = [...vowelMap, ...cvcMap].reduce(
      (sum, node) => sum + (node.state === "completed" ? node.stars ?? 0 : 0),
      0
    );

    return {
      ...student,
      vowelMap,
      cvcMap,
      vowelDone,
      cvcDone,
      done,
      total,
      percent,
      recent,
      average,
      stars,
      latest: recent[0] || null,
      currentVowel: vowelMap.find((node) => node.state === "current") || null,
      currentWord: cvcMap.find((node) => node.state === "current") || null,
      status: done === 0 ? "new" : done >= total ? "complete" : "active",
    };
  });
}

export function classStats(summaries) {
  return {
    total: summaries.length,
    active: summaries.filter((student) => (student.enrollment_status || "active") === "active").length,
    sned: summaries.filter((student) => student.special_needs).length,
    progress: classProgress(summaries),
  };
}

export function totalStars(summaries) {
  return summaries.reduce((sum, student) => sum + (student.stars || 0), 0);
}

export function needsAttention(summaries) {
  return summaries
    .filter((student) => student.percent < 40 || (student.average !== null && student.average < 65))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 4);
}

export function classProgress(summaries) {
  if (!summaries.length) return 0;
  const total = summaries.reduce((sum, student) => sum + student.percent, 0);
  return Math.round(total / summaries.length);
}

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function statusLabel(student) {
  if (student.special_needs) return "Adapted plan";
  if (student.status === "new") return "Not started";
  if (student.status === "complete") return "All done";
  return `${student.percent}% progress`;
}

export function statusTone(student) {
  if (student.special_needs) return "bg-[#e8e2f8] text-[#5b4a8a]";
  if (student.status === "new") return "bg-[#fde9c9] text-[#8a6a12]";
  if (student.status === "complete") return "bg-[#d7f5e3] text-[#166534]";
  return "bg-[#dbeafe] text-[#1e4b8a]";
}
