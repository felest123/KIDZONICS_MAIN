import { useMemo, useState } from "react";
import { Plus, Pencil, Search, Lock, UserRound, TrendingUp, ClipboardList, HeartHandshake, Star } from "lucide-react";
import StudentPhoto from "@/components/teacher/StudentPhoto";
import { classStats, statusLabel, statusTone } from "@/lib/teacher";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All students" },
  { id: "regular", label: "Regular" },
  { id: "sned", label: "SNED" },
];

function Stat({ label, value, tone }) {
  return (
    <div className={cn("rounded-[1.3rem] px-3 py-2.5", tone)}>
      <p className="font-display text-xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

export default function ClassView({
  summaries,
  teacher,
  onAdd,
  onEdit,
  onToggleSpecial,
  onOpenStudent,
  busyId,
  prefs,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const stats = useMemo(() => classStats(summaries), [summaries]);

  const filtered = summaries.filter((student) => {
    const matchesQuery = `${student.name} ${student.section} ${student.student_id || ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesFilter =
      filter === "all" || (filter === "sned" ? student.special_needs : !student.special_needs);
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">Master list</h1>
          <p className="text-sm font-bold text-[#8aa8ac]">Register students and track their phonics progress.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9db6ba]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, section or ID"
              className="w-full rounded-full border-2 border-[#e2eef0] bg-white py-3 pl-11 pr-4 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#b6d3ff]"
            />
          </div>
          <button
            onClick={onAdd}
            className="flex shrink-0 items-center gap-1 rounded-full bg-[#5bbf8a] px-4 py-3 text-xs font-extrabold text-white shadow-[0_4px_0_#3f9c6b]"
          >
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Advisory students" value={stats.total} tone="bg-[#e8f4ff] text-[#1e4b8a]" />
        <Stat label="Active students" value={stats.active} tone="bg-[#e6f7ee] text-[#166534]" />
        <Stat label="SNED students" value={stats.sned} tone="bg-[#f3e9fb] text-[#5b4a8a]" />
        <Stat label="Class progress" value={`${stats.progress}%`} tone="bg-[#fdf1dc] text-[#8a6a12]" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={cn(
              "rounded-full px-3.5 py-2 text-[11px] font-extrabold transition",
              filter === option.id
                ? "bg-[#b6d3ff] text-[#173a63] shadow-[0_3px_0_#96baf0]"
                : "bg-white text-[#5b7f86] ring-1 ring-[#e2eef0]"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[1.6rem] bg-white px-4 py-12 text-center ring-1 ring-[#e2eef0]">
          <p className="font-display text-lg font-extrabold text-[#2c4a52]">No students found</p>
          <p className="mt-1 text-xs font-bold text-[#8aa8ac]">Register a student to build your Master list.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((student) => {
            const isMine = !student.advisory_teacher_email || student.advisory_teacher_email === teacher?.email;
            const enrollment = student.enrollment_status || "active";
            return (
              <div key={student.id} className="rounded-[1.4rem] bg-white p-3 ring-1 ring-[#e2eef0] sm:p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StudentPhoto uri={student.photo_uri} name={student.name} className="h-11 w-11" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-display text-base font-extrabold text-[#2c4a52]">{student.name}</p>
                      {student.special_needs && (
                        <span className="rounded-full bg-[#f3e9fb] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#5b4a8a]">
                          SNED
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase",
                          enrollment === "active"
                            ? "bg-[#d7f5e3] text-[#166534]"
                            : enrollment === "transferred"
                              ? "bg-[#fdf1dc] text-[#8a6a12]"
                              : "bg-[#f1f5f5] text-[#7d9ba0]"
                        )}
                      >
                        {enrollment}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-[#8aa8ac]">
                      {student.section} · ID {student.student_id || "—"} · {student.advisory_teacher_name || "No adviser"}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#7d9ba0]">
                      Vowels {student.vowelDone}/{student.vowelMap.length} · CVC {student.cvcDone}/{student.cvcMap.length} ·{" "}
                      <span className="inline-flex items-center gap-0.5 align-middle">
                        <Star className="h-3 w-3 fill-[#f5c451] text-[#f5c451]" />
                        {student.stars} stars
                      </span>
                      {student.latest
                        ? ` · Last check ${Math.round(student.latest.accuracy)}% on ${student.latest.lesson_key}`
                        : " · No voice checks yet"}
                    </p>
                  </div>

                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase", statusTone(student))}>
                    {statusLabel(student)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef4f3]">
                    <span className="block h-full rounded-full bg-[#5bbf8a]" style={{ width: `${student.percent}%` }} />
                  </span>
                  <span className="w-10 text-right text-[11px] font-extrabold text-[#7d9ba0]">{student.percent}%</span>
                </div>

                {student.latest && (
                  <p className="mt-1 text-[10px] font-bold text-[#9db6ba]">
                    Latest assessment: {formatDate(student.latest.created_date, prefs)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => onOpenStudent(student.id, "profile")}
                    className="flex items-center gap-1 rounded-full bg-[#f1f7f6] px-3 py-2 text-[11px] font-extrabold text-[#5b7f86] hover:bg-[#e8f4ff]"
                  >
                    <UserRound className="h-3.5 w-3.5" /> Profile
                  </button>
                  <button
                    onClick={() => onOpenStudent(student.id, "progress")}
                    className="flex items-center gap-1 rounded-full bg-[#f1f7f6] px-3 py-2 text-[11px] font-extrabold text-[#5b7f86] hover:bg-[#e8f4ff]"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> Progress
                  </button>
                  <button
                    onClick={() => onOpenStudent(student.id, "results")}
                    className="flex items-center gap-1 rounded-full bg-[#f1f7f6] px-3 py-2 text-[11px] font-extrabold text-[#5b7f86] hover:bg-[#e8f4ff]"
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> Results
                  </button>
                  <button
                    onClick={() => onEdit(student)}
                    className="flex items-center gap-1 rounded-full bg-[#f1f7f6] px-3 py-2 text-[11px] font-extrabold text-[#5b7f86] hover:bg-[#e8f4ff]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>

                  <span className="flex-1" />

                  {isMine ? (
                    <button
                      onClick={() => onToggleSpecial(student)}
                      disabled={busyId === student.id}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-extrabold transition disabled:opacity-60",
                        student.special_needs
                          ? "bg-[#5bbf8a] text-white"
                          : "bg-[#f1f7f6] text-[#5b7f86] hover:bg-[#e6f7ee]"
                      )}
                      title="Only the advisory teacher can change the SNED plan"
                    >
                      <HeartHandshake className="h-3.5 w-3.5" />
                      {student.special_needs ? "SNED on" : "SNED off"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-[#f1f5f5] px-3 py-2 text-[11px] font-extrabold text-[#9db6ba]">
                      <Lock className="h-3.5 w-3.5" /> Other teacher
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
