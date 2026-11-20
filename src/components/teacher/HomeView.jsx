import { Search, Plus, Sparkles, ChevronRight, BarChart3, BookOpen, HeartHandshake } from "lucide-react";
import ProgressRing from "@/components/teacher/ProgressRing";
import StudentPhoto from "@/components/teacher/StudentPhoto";
import { classProgress, needsAttention, statusLabel, statusTone, greetingFor } from "@/lib/teacher";
import { cn } from "@/lib/utils";

const PASTELS = ["bg-[#e8f4ff]", "bg-[#e6f7ee]", "bg-[#fdf1dc]", "bg-[#f3e9fb]", "bg-[#ffe9e3]"];

export default function HomeView({ teacher, summaries, query, setQuery, onOpenStudent, onAdd, onNavigate }) {
  const filtered = summaries.filter((student) => student.name.toLowerCase().includes(query.trim().toLowerCase()));
  const progress = classProgress(summaries);
  const attention = needsAttention(summaries);
  const firstName = (teacher?.full_name || "Teacher").split(" ")[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">
            {greetingFor()}, Teacher {firstName}!
          </h1>
          <p className="text-sm font-bold text-[#8aa8ac]">Here is how your phonics class is doing today.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9db6ba]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student"
            className="w-full rounded-full border-2 border-[#e2eef0] bg-white py-3 pl-11 pr-4 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#b6d3ff]"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0] lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Class overview</h2>
            <button
              onClick={() => onNavigate("class")}
              className="flex items-center gap-1 text-xs font-extrabold text-[#5b8fb9]"
            >
              Master list <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl bg-[#f6faf9] px-4 py-8 text-center">
              <p className="font-display text-base font-extrabold text-[#2c4a52]">No students yet</p>
              <p className="mt-1 text-xs font-bold text-[#8aa8ac]">Register your first student to get started.</p>
              <button
                onClick={onAdd}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#5bbf8a] px-4 py-2 text-xs font-extrabold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Register student
              </button>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {filtered.map((student, index) => (
                <button
                  key={student.id}
                  onClick={() => onOpenStudent(student.id)}
                  className={cn(
                    "min-w-[150px] rounded-[1.3rem] p-3 text-left transition hover:brightness-[0.98]",
                    PASTELS[index % PASTELS.length]
                  )}
                >
                  <span className="flex items-center justify-between">
                    <StudentPhoto uri={student.photo_uri} name={student.name} className="h-9 w-9" />
                    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase", statusTone(student))}>
                      {statusLabel(student)}
                    </span>
                  </span>
                  <span className="mt-2 block truncate font-display text-sm font-extrabold text-[#2c4a52]">
                    {student.name}
                  </span>
                  <span className="block text-[10px] font-bold text-[#7d9ba0]">{student.section}</span>
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/70">
                    <span className="block h-full rounded-full bg-[#5bbf8a]" style={{ width: `${student.percent}%` }} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <h2 className="mb-1 font-display text-lg font-extrabold text-[#2c4a52]">Class progress</h2>
          <ProgressRing value={progress} />
          <p className="mt-1 text-center text-[11px] font-bold text-[#8aa8ac]">
            {summaries.length} students · {summaries.reduce((sum, student) => sum + (student.stars || 0), 0)} stars
            earned
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Students needing attention</h2>
          {attention.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[#f6faf9] px-4 py-6 text-center text-xs font-bold text-[#8aa8ac]">
              Everyone is on track today.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {attention.map((student) => (
                <div key={student.id} className="flex items-center gap-3 rounded-xl bg-[#f8fbfb] px-3 py-2">
                  <StudentPhoto uri={student.photo_uri} name={student.name} className="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-extrabold text-[#2c4a52]">{student.name}</p>
                    <p className="truncate text-[11px] font-bold text-[#8aa8ac]">
                      {student.average !== null && student.average < 65
                        ? `Pronunciation average ${student.average}%`
                        : student.done === 0
                          ? "Has not started their songs yet"
                          : `Struggling with ${student.vowelDone < student.cvcDone ? "vowels" : "CVC words"}`}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenStudent(student.id)}
                    className="shrink-0 rounded-full bg-[#b6d3ff] px-3 py-1.5 text-[11px] font-extrabold text-[#173a63]"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#2c4a52]">
            <Sparkles className="h-4 w-4 text-[#5bbf8a]" /> Smart actions
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              onClick={onAdd}
              className="flex items-center gap-2 rounded-xl bg-[#e6f7ee] px-3 py-3 text-left text-xs font-extrabold text-[#166534]"
            >
              <Plus className="h-4 w-4" /> Register a student
            </button>
            <button
              onClick={() => onNavigate("reports")}
              className="flex items-center gap-2 rounded-xl bg-[#e8f4ff] px-3 py-3 text-left text-xs font-extrabold text-[#1e4b8a]"
            >
              <BarChart3 className="h-4 w-4" /> Review reports
            </button>
            <button
              onClick={() => onNavigate("lessons")}
              className="flex items-center gap-2 rounded-xl bg-[#fdf1dc] px-3 py-3 text-left text-xs font-extrabold text-[#8a6a12]"
            >
              <BookOpen className="h-4 w-4" /> See lessons
            </button>
            <button
              onClick={() => onNavigate("class")}
              className="flex items-center gap-2 rounded-xl bg-[#f3e9fb] px-3 py-3 text-left text-xs font-extrabold text-[#5b4a8a]"
            >
              <HeartHandshake className="h-4 w-4" /> Adapted plans
            </button>
          </div>
          <p className="mt-3 rounded-xl bg-[#f8fbfb] px-3 py-2 text-[11px] font-bold text-[#7d9ba0]">
            Tip: only the advisory teacher can switch a student to the calm learning plan.
          </p>
        </div>
      </div>
    </div>
  );
}
