import { useMemo } from "react";
import { ArrowLeft, Star } from "lucide-react";
import ReportsLineChart from "@/components/teacher/ReportsLineChart";
import LessonChips from "@/components/teacher/LessonChips";
import StudentPhoto from "@/components/teacher/StudentPhoto";
import { dayLabel, formatDate, formatTime, DEFAULT_PREFS } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function StudentReportView({ student, prefs = DEFAULT_PREFS, onBack }) {
  const results = useMemo(
    () =>
      [...(student.recent || [])].sort(
        (a, b) => new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime()
      ),
    [student.recent]
  );

  const chartData = useMemo(
    () =>
      results.map((result) => ({
        label: dayLabel(result.created_date, prefs),
        overall: Math.round(result.accuracy || 0),
      })),
    [results, prefs]
  );

  const attempts = student.recent?.length || 0;
  const completedLessons = [...student.vowelMap, ...student.cvcMap].filter(
    (node) => node.state === "completed"
  );

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to class reports
      </button>

      <div className="flex flex-wrap items-center gap-3 rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <StudentPhoto uri={student.photo_uri} name={student.name} className="h-16 w-16" rounded="rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-[#2c4a52]">{student.name}</h1>
          <p className="text-xs font-bold text-[#8aa8ac]">
            {student.section} · ID {student.student_id || "—"} · Individual statistics
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[#fdf1dc] px-3 py-1.5 text-[11px] font-extrabold text-[#8a6a12]">
          <Star className="h-3.5 w-3.5 fill-[#f5c451] text-[#f5c451]" /> {student.stars} stars
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.4rem] bg-[#e6f7ee] p-4">
          <p className="font-display text-2xl font-extrabold text-[#166534]">{student.done}</p>
          <p className="text-[11px] font-extrabold uppercase text-[#3f9c6b]">Lessons completed</p>
        </div>
        <div className="rounded-[1.4rem] bg-[#e8f4ff] p-4">
          <p className="font-display text-2xl font-extrabold text-[#1e4b8a]">
            {student.vowelDone}/{student.vowelMap.length}
          </p>
          <p className="text-[11px] font-extrabold uppercase text-[#5b8fb9]">Vowel lessons</p>
        </div>
        <div className="rounded-[1.4rem] bg-[#fdf1dc] p-4">
          <p className="font-display text-2xl font-extrabold text-[#8a6a12]">
            {student.cvcDone}/{student.cvcMap.length}
          </p>
          <p className="text-[11px] font-extrabold uppercase text-[#c08a1e]">CVC lessons</p>
        </div>
        <div className="rounded-[1.4rem] bg-[#f3e9fb] p-4">
          <p className="font-display text-2xl font-extrabold text-[#5b4a8a]">{attempts}</p>
          <p className="text-[11px] font-extrabold uppercase text-[#7c5fd3]">Assessment attempts</p>
        </div>
      </div>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Pronunciation progress history</h2>
        <ReportsLineChart data={chartData} single />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Lesson completion history</h2>
          {completedLessons.length === 0 ? (
            <p className="mt-2 text-xs font-bold text-[#9db6ba]">No lessons completed yet.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {completedLessons.map((node) => (
                <div
                  key={`${node.key}-done`}
                  className="flex items-center gap-2 rounded-xl bg-[#f8fbfb] px-3 py-2 text-xs font-extrabold text-[#2c4a52]"
                >
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-white px-1.5 text-[11px] text-[#166534] ring-1 ring-[#e2eef0]">
                    {node.label}
                  </span>
                  <span className="flex-1">{node.state === "completed" ? "Completed" : node.state}</span>
                  <span className="text-[11px] font-bold text-[#8aa8ac]">{node.attempts} tries</span>
                  <span className="flex items-center gap-0.5">
                    {[0, 1, 2].map((index) => (
                      <Star
                        key={index}
                        className={cn(
                          "h-3 w-3",
                          index < (node.stars || 0) ? "fill-[#f5c451] text-[#f5c451]" : "text-[#dbe6e6]"
                        )}
                      />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase text-[#8aa8ac]">Vowels</p>
              <LessonChips map={student.vowelMap} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase text-[#8aa8ac]">CVC words</p>
              <LessonChips map={student.cvcMap} />
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Individual assessment results</h2>
          {results.length === 0 ? (
            <p className="mt-2 text-xs font-bold text-[#9db6ba]">No assessment records yet.</p>
          ) : (
            <div className="mt-2 max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
              {[...results].reverse().map((result) => (
                <div key={result.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f8fbfb] px-2.5 py-2">
                  <span className="text-[11px] font-extrabold text-[#2c4a52]">
                    {result.target || result.lesson_key}
                  </span>
                  <span className="text-[10px] font-bold text-[#8aa8ac]">
                    {result.module === "vowels" ? "Vowel" : "CVC"} · trial {result.trial || 1}
                  </span>
                  <span className="flex-1" />
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
                    {formatDate(result.created_date, prefs)} {formatTime(result.created_date, prefs)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
