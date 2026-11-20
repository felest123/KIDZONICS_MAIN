import { useState } from "react";
import { ArrowLeft, Pencil, HeartHandshake, Phone, Mail, Star, Lock } from "lucide-react";
import StudentPhoto from "@/components/teacher/StudentPhoto";
import LessonChips from "@/components/teacher/LessonChips";
import { formatDate, formatTime, DEFAULT_PREFS } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "progress", label: "Progress" },
  { id: "results", label: "Assessment results" },
];

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#9db6ba]">{label}</p>
      <p className="break-words text-sm font-extrabold text-[#2c4a52]">{value || "—"}</p>
    </div>
  );
}

export default function StudentProfileView({
  student,
  teacher,
  busyId,
  initialTab = "profile",
  onBack,
  onEdit,
  onToggleSpecial,
  prefs = DEFAULT_PREFS,
}) {
  const [tab, setTab] = useState(initialTab);
  const isMine = !student.advisory_teacher_email || student.advisory_teacher_email === teacher?.email;
  const enrollment = student.enrollment_status || "active";

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Master list
      </button>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <div className="flex flex-wrap items-center gap-3">
          <StudentPhoto uri={student.photo_uri} name={student.name} className="h-20 w-20" rounded="rounded-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="font-display text-2xl font-extrabold text-[#2c4a52]">{student.name}</h1>
              {student.special_needs && (
                <span className="rounded-full bg-[#f3e9fb] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#5b4a8a]">
                  SNED
                </span>
              )}
              <span className="rounded-full bg-[#eef4f3] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#5b7f86]">
                {enrollment}
              </span>
            </div>
            <p className="text-xs font-bold text-[#8aa8ac]">
              {student.section} · ID {student.student_id || "—"} · Adviser {student.advisory_teacher_name || "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onEdit(student)}
                className="flex items-center gap-1 rounded-full bg-[#b6d3ff] px-3 py-1.5 text-[11px] font-extrabold text-[#173a63]"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit student
              </button>
              {isMine ? (
                <button
                  onClick={() => onToggleSpecial(student)}
                  disabled={busyId === student.id}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-extrabold disabled:opacity-60",
                    student.special_needs ? "bg-[#5bbf8a] text-white" : "bg-[#f1f7f6] text-[#5b7f86]"
                  )}
                >
                  <HeartHandshake className="h-3.5 w-3.5" />
                  {student.special_needs ? "SNED enabled" : "Enable SNED"}
                </button>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-[#f1f5f5] px-3 py-1.5 text-[11px] font-extrabold text-[#9db6ba]">
                  <Lock className="h-3.5 w-3.5" /> Adviser controls SNED
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl bg-[#fdf1dc] px-3 py-2 text-center">
              <p className="font-display text-lg font-extrabold leading-none text-[#8a6a12]">{student.stars}</p>
              <p className="text-[10px] font-extrabold uppercase text-[#c08a1e]">Stars</p>
            </div>
            <div className="rounded-xl bg-[#e6f7ee] px-3 py-2 text-center">
              <p className="font-display text-lg font-extrabold leading-none text-[#166534]">{student.percent}%</p>
              <p className="text-[10px] font-extrabold uppercase text-[#3f9c6b]">Progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-3.5 py-2 text-[11px] font-extrabold transition",
              tab === item.id
                ? "bg-[#b6d3ff] text-[#173a63] shadow-[0_3px_0_#96baf0]"
                : "bg-white text-[#5b7f86] ring-1 ring-[#e2eef0]"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-3">
          <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
            <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Student information</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Student ID" value={student.student_id} />
              <Info label="Section" value={student.section} />
              <Info label="Advisory teacher" value={student.advisory_teacher_name || student.advisory_teacher_email} />
              <Info label="Enrollment status" value={enrollment} />
              <Info label="SNED classification" value={student.special_needs ? "SNED" : "Regular"} />
              <Info label="Middle name" value={student.middle_name} />
            </div>
          </div>

          <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
            <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Parent / guardian contact</h2>
            {student.guardian_name || student.guardian_phone || student.guardian_email ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#9db6ba]">Guardian name</p>
                  <p className="text-sm font-extrabold text-[#2c4a52]">{student.guardian_name || "—"}</p>
                </div>
                <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
                  <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#9db6ba]">
                    <Phone className="h-3 w-3" /> Contact number
                  </p>
                  {student.guardian_phone ? (
                    <a
                      href={`tel:${student.guardian_phone}`}
                      className="text-sm font-extrabold text-[#0d6f74] underline underline-offset-2"
                    >
                      {student.guardian_phone}
                    </a>
                  ) : (
                    <p className="text-sm font-extrabold text-[#2c4a52]">—</p>
                  )}
                </div>
                <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
                  <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#9db6ba]">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  {student.guardian_email ? (
                    <a
                      href={`mailto:${student.guardian_email}`}
                      className="break-all text-sm font-extrabold text-[#0d6f74] underline underline-offset-2"
                    >
                      {student.guardian_email}
                    </a>
                  ) : (
                    <p className="text-sm font-extrabold text-[#2c4a52]">Not provided</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-2 rounded-xl bg-[#f8fbfb] px-3 py-4 text-center text-xs font-bold text-[#8aa8ac]">
                No guardian contact recorded yet. Use Edit student to add it.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "progress" && (
        <div className="space-y-3">
          <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Overall learning progress</h2>
              <span className="flex items-center gap-1 rounded-full bg-[#fdf1dc] px-2.5 py-1 text-[11px] font-extrabold text-[#8a6a12]">
                <Star className="h-3.5 w-3.5 fill-[#f5c451] text-[#f5c451]" /> {student.stars} stars earned
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#eef4f3]">
                <span className="block h-full rounded-full bg-[#5bbf8a]" style={{ width: `${student.percent}%` }} />
              </span>
              <span className="text-xs font-extrabold text-[#7d9ba0]">{student.percent}%</span>
            </div>
            <p className="mt-2 text-[11px] font-bold text-[#8aa8ac]">
              {student.done} of {student.total} curriculum lessons completed · Vowels {student.vowelDone}/
              {student.vowelMap.length} · CVC {student.cvcDone}/{student.cvcMap.length}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
              <p className="mb-2 text-[11px] font-extrabold uppercase text-[#8aa8ac]">Vowels</p>
              <LessonChips map={student.vowelMap} />
            </div>
            <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
              <p className="mb-2 text-[11px] font-extrabold uppercase text-[#8aa8ac]">CVC words</p>
              <LessonChips map={student.cvcMap} />
            </div>
          </div>

          <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
            <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Latest assessment results</h2>
            {student.recent.length === 0 ? (
              <p className="mt-2 text-xs font-bold text-[#9db6ba]">No pronunciation results yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {student.recent.slice(0, 8).map((result) => (
                  <span
                    key={result.id}
                    className="rounded-full bg-[#f8fbfb] px-2.5 py-1 text-[11px] font-extrabold text-[#4b6a72] ring-1 ring-[#e2eef0]"
                  >
                    {result.lesson_key} · {Math.round(result.accuracy)}%
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "results" && (
        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Individual assessment results</h2>
            <span className="rounded-full bg-[#eef4f3] px-2.5 py-1 text-[11px] font-extrabold text-[#5b7f86]">
              {student.recent.length} attempts
            </span>
          </div>
          {student.recent.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[#f8fbfb] px-4 py-6 text-center text-xs font-bold text-[#8aa8ac]">
              No assessment records yet. Results appear after a student finishes a “Say it” trial.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {student.recent.slice(0, 40).map((result) => (
                <div key={result.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f8fbfb] px-3 py-2">
                  <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-white px-2 text-[11px] font-extrabold text-[#2c4a52] ring-1 ring-[#e2eef0]">
                    {result.target || result.lesson_key}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-[#2c4a52]">
                      {result.module === "vowels" ? "Vowel" : "CVC"} {result.lesson_key} · trial {result.trial || 1}
                    </p>
                    <p className="truncate text-[11px] font-bold text-[#8aa8ac]">
                      {result.feedback || "Recorded pronunciation check"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                      result.accuracy >= 75
                        ? "bg-[#d7f5e3] text-[#166534]"
                        : result.accuracy >= 55
                          ? "bg-[#fdf1dc] text-[#8a6a12]"
                          : "bg-[#ffe4e0] text-[#a34c3f]"
                    )}
                  >
                    {Math.round(result.accuracy)}%
                  </span>
                  <span className="text-[10px] font-bold text-[#9db6ba]">
                    {formatDate(result.created_date, prefs)} · {formatTime(result.created_date, prefs)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
