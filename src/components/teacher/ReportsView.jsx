import { useMemo } from "react";
import { BarChart3, ChevronRight, Star, TrendingUp, Users } from "lucide-react";
import ReportsLineChart from "@/components/teacher/ReportsLineChart";
import { dayLabel, formatDate, DEFAULT_PREFS } from "@/lib/format";

export default function ReportsView({ summaries, assessments, prefs = DEFAULT_PREFS, onOpenStudent }) {
  const results = useMemo(
    () =>
      [...assessments].sort(
        (a, b) => new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime()
      ),
    [assessments]
  );

  const vowelResults = results.filter((item) => item.module === "vowels");
  const cvcResults = results.filter((item) => item.module === "cvc");
  const averageOf = (list) =>
    list.length ? Math.round(list.reduce((sum, item) => sum + (item.accuracy || 0), 0) / list.length) : 0;

  const classAverage = averageOf(results);
  const vowelAverage = averageOf(vowelResults);
  const cvcAverage = averageOf(cvcResults);

  const chartData = useMemo(() => {
    const buckets = new Map();
    results.forEach((result) => {
      const at = new Date(result.created_date || 0);
      if (Number.isNaN(at.getTime())) return;
      const key = at.toISOString().slice(0, 10);
      const bucket =
        buckets.get(key) || { key, at, total: 0, count: 0, vowelTotal: 0, vowelCount: 0, cvcTotal: 0, cvcCount: 0 };
      bucket.total += result.accuracy || 0;
      bucket.count += 1;
      if (result.module === "vowels") {
        bucket.vowelTotal += result.accuracy || 0;
        bucket.vowelCount += 1;
      } else {
        bucket.cvcTotal += result.accuracy || 0;
        bucket.cvcCount += 1;
      }
      buckets.set(key, bucket);
    });
    return [...buckets.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-14)
      .map((bucket) => ({
        label: dayLabel(bucket.at, prefs),
        overall: Math.round(bucket.total / bucket.count),
        vowels: bucket.vowelCount ? Math.round(bucket.vowelTotal / bucket.vowelCount) : null,
        cvc: bucket.cvcCount ? Math.round(bucket.cvcTotal / bucket.cvcCount) : null,
      }));
  }, [results, prefs]);

  const needingPractice = summaries
    .filter((student) => (student.average !== null && student.average < 70) || student.percent < 40)
    .sort((a, b) => (a.average ?? 0) - (b.average ?? 0));

  const stars = summaries.reduce((sum, student) => sum + (student.stars || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">Reports</h1>
        <p className="text-sm font-bold text-[#8aa8ac]">Every pronunciation check is recorded here.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[1.4rem] bg-[#e6f7ee] p-4">
          <TrendingUp className="h-5 w-5 text-[#3f9c6b]" />
          <p className="mt-2 font-display text-2xl font-extrabold text-[#166534]">{classAverage}%</p>
          <p className="text-[11px] font-extrabold uppercase text-[#3f9c6b]">Class pronunciation average</p>
        </div>
        <div className="rounded-[1.4rem] bg-[#e8f4ff] p-4">
          <BarChart3 className="h-5 w-5 text-[#5b8fb9]" />
          <p className="mt-2 font-display text-2xl font-extrabold text-[#1e4b8a]">{results.length}</p>
          <p className="text-[11px] font-extrabold uppercase text-[#5b8fb9]">Assessments recorded</p>
        </div>
        <div className="rounded-[1.4rem] bg-[#f3e9fb] p-4">
          <Users className="h-5 w-5 text-[#7c5fd3]" />
          <p className="mt-2 font-display text-2xl font-extrabold text-[#5b4a8a]">{needingPractice.length}</p>
          <p className="text-[11px] font-extrabold uppercase text-[#7c5fd3]">Need more practice</p>
        </div>
        <div className="rounded-[1.4rem] bg-[#fdf1dc] p-4">
          <Star className="h-5 w-5 text-[#c08a1e]" />
          <p className="mt-2 font-display text-2xl font-extrabold text-[#8a6a12]">{stars}</p>
          <p className="text-[11px] font-extrabold uppercase text-[#c08a1e]">Stars earned by class</p>
        </div>
      </div>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Pronunciation performance over time</h2>
          <span className="rounded-full bg-[#eef4f3] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#5b7f86]">
            Average accuracy by day
          </span>
        </div>
        <ReportsLineChart data={chartData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Vowel vs CVC performance</h2>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-[#8aa8ac]">
                <span>Vowel assessments ({vowelResults.length})</span>
                <span className="text-[#1e4b8a]">{vowelAverage}%</span>
              </div>
              <span className="mt-1 block h-2.5 overflow-hidden rounded-full bg-[#eef4f3]">
                <span className="block h-full rounded-full bg-[#5b8fb9]" style={{ width: `${vowelAverage}%` }} />
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-[#8aa8ac]">
                <span>CVC word assessments ({cvcResults.length})</span>
                <span className="text-[#8a6a12]">{cvcAverage}%</span>
              </div>
              <span className="mt-1 block h-2.5 overflow-hidden rounded-full bg-[#eef4f3]">
                <span className="block h-full rounded-full bg-[#f2c97d]" style={{ width: `${cvcAverage}%` }} />
              </span>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-[#f8fbfb] px-3 py-2 text-[11px] font-bold text-[#7d9ba0]">
            Averages come straight from saved assessment records. No lessons are scored here.
          </p>
        </div>

        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Students needing additional practice</h2>
          {needingPractice.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[#f8fbfb] px-4 py-6 text-center text-xs font-bold text-[#8aa8ac]">
              No one is flagged right now.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {needingPractice.slice(0, 6).map((student) => (
                <button
                  key={student.id}
                  onClick={() => onOpenStudent(student.id)}
                  className="flex w-full items-center gap-2 rounded-xl bg-[#f8fbfb] px-3 py-2 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-[#2c4a52]">{student.name}</p>
                    <p className="truncate text-[11px] font-bold text-[#8aa8ac]">
                      {student.average !== null ? `${student.average}% pronunciation average` : "No checks yet"} ·{" "}
                      {student.section}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#9db6ba]" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Class learning progress</h2>
        {summaries.length === 0 ? (
          <p className="mt-3 text-xs font-bold text-[#8aa8ac]">No students registered yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {summaries.map((student) => (
              <button
                key={student.id}
                onClick={() => onOpenStudent(student.id)}
                className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-[#f8fbfb]"
              >
                <span className="w-28 shrink-0 truncate text-xs font-extrabold text-[#2c4a52] sm:w-44">
                  {student.name}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef4f3]">
                  <span className="block h-full rounded-full bg-[#5bbf8a]" style={{ width: `${student.percent}%` }} />
                </span>
                <span className="w-12 text-right text-[11px] font-extrabold text-[#7d9ba0]">{student.percent}%</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#c3d6d8]" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Latest assessment results</h2>
        {results.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#f8fbfb] px-4 py-6 text-center text-xs font-bold text-[#8aa8ac]">
            No assessments yet. Results appear after a student finishes a “Say it” trial.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-wide text-[#9db6ba]">
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Lesson</th>
                  <th className="pb-2">Accuracy</th>
                  <th className="pb-2">Feedback</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...results].reverse().slice(0, 40).map((result) => (
                  <tr key={result.id} className="border-t border-[#eef4f3]">
                    <td className="py-2 text-xs font-extrabold text-[#2c4a52]">{result.student_name || "—"}</td>
                    <td className="py-2 text-xs font-bold text-[#4b6a72]">
                      {result.module === "vowels" ? "Vowel" : "CVC"} {result.lesson_key}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                          result.accuracy >= 75
                            ? "bg-[#d7f5e3] text-[#166534]"
                            : result.accuracy >= 55
                              ? "bg-[#fdf1dc] text-[#8a6a12]"
                              : "bg-[#ffe4e0] text-[#a34c3f]"
                        }`}
                      >
                        {Math.round(result.accuracy)}%
                      </span>
                    </td>
                    <td className="max-w-[220px] py-2 text-[11px] font-bold text-[#7d9ba0]">{result.feedback}</td>
                    <td className="py-2 text-[11px] font-bold text-[#9db6ba]">{formatDate(result.created_date, prefs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
