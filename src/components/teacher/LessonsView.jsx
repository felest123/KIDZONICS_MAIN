import { useEffect, useState } from "react";
import { BookOpen, Eye, UserPlus, Users, Star, Volume2, Sparkles, Loader2, X, Library } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MODULES } from "@/lib/curriculum";
import LessonPreviewDialog from "@/components/teacher/LessonPreviewDialog";
import { cn } from "@/lib/utils";

function AssignDialog({ lesson, students, onClose, onAssigned }) {
  const [audience, setAudience] = useState("all");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const assign = async () => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("teacherLessons", {
        action: "assign",
        lesson_id: lesson.id,
        audience,
        student_ids: audience === "student" ? picked : [],
      });
      onAssigned();
    } catch (err) {
      setError(err?.response?.data?.error || "The lesson could not be assigned.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c4a52]/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[1.6rem] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#8aa8ac]">Assign lesson</p>
            <h2 className="font-display text-xl font-extrabold text-[#2c4a52]">{lesson.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-[#f1f7f6] p-2 text-[#5b7f86]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ["all", "My whole class", Users],
            ["student", "Chosen students", UserPlus],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setAudience(value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-extrabold",
                audience === value ? "bg-[#b6d3ff] text-[#173a63]" : "bg-[#f8fbfb] text-[#5b7f86] ring-1 ring-[#e2eef0]"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {audience === "student" && (
          <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
            {students.length === 0 && <li className="text-xs font-bold text-[#8aa8ac]">No students in your class yet.</li>}
            {students.map((student) => (
              <li key={student.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f8fbfb]">
                  <input type="checkbox" checked={picked.includes(student.id)} onChange={() => toggle(student.id)} />
                  <span className="text-xs font-bold text-[#2c4a52]">{student.name}</span>
                  <span className="text-[10px] font-bold text-[#9db6ba]">{student.section}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-xs font-bold text-[#a34c3f]">{error}</p>}
        <button
          onClick={assign}
          disabled={busy || (audience === "student" && picked.length === 0)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#5bbf8a] px-4 py-3 text-xs font-extrabold text-white shadow-[0_4px_0_#3f9c6b] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Assign lesson
        </button>
      </div>
    </div>
  );
}

export default function LessonsView({ teacher, summaries }) {
  const [library, setLibrary] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [legacy, setLegacy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const load = async () => {
    try {
      const response = await base44.functions.invoke("teacherLessons", { action: "list" });
      setLibrary(response.data.library || []);
      setAssignments(response.data.assignments || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "The lesson library could not be loaded.");
    }
    // Lessons this teacher created before the central library existed (read-only now).
    // Access rules return only this teacher's own lessons plus published library ones.
    const page = await base44.entities.LessonPlan.filter({}, { limit: 100, sort: "-created_date" }).catch(() => null);
    setLegacy((page?.items ?? []).filter((plan) => !plan.library));
  };

  useEffect(() => {
    let active = true;
    (async () => {
      await load();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [teacher?.email]);

  const unassign = async (assignment) => {
    await base44.functions.invoke("teacherLessons", { action: "unassign", id: assignment.id }).catch(() => {});
    await load();
  };

  const assignmentsFor = (lessonId) => assignments.filter((a) => a.lesson_id === lessonId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">Lessons</h1>
          <p className="text-sm font-bold text-[#8aa8ac]">The phonics curriculum your students see on the kiosk.</p>
        </div>
      </div>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#2c4a52]">
            <Library className="h-5 w-5 text-[#3f9c6b]" /> Lesson library
          </h2>
          <span className="rounded-full bg-[#eef4f3] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#5b7f86]">
            {library.length} published
          </span>
        </div>
        <p className="mt-1 text-[11px] font-bold text-[#9db6ba]">
          Lessons are prepared and published by the school administrator. Need a new one? Use Contact Administrator.
        </p>

        {loading ? (
          <div className="mt-4 flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[#5bbf8a]" />
          </div>
        ) : error ? (
          <p className="mt-3 rounded-xl bg-[#ffe4e0] px-4 py-3 text-xs font-bold text-[#a34c3f]">{error}</p>
        ) : library.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#f8fbfb] px-4 py-8 text-center text-xs font-bold text-[#8aa8ac]">
            No lessons have been published yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {library.map((lesson) => {
              const given = assignmentsFor(lesson.id);
              return (
                <div key={lesson.id} className="rounded-[1.2rem] bg-[#f8fbfb] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "flex h-9 min-w-12 items-center justify-center rounded-lg px-2 font-display text-sm font-extrabold",
                        lesson.category === "vowels" ? "bg-[#e6f7ee] text-[#166534]" : "bg-[#e8f4ff] text-[#1e4b8a]"
                      )}
                    >
                      {lesson.target}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#2c4a52]">{lesson.title}</p>
                      <p className="truncate text-[11px] font-bold text-[#8aa8ac]">
                        {lesson.category === "vowels" ? "Vowels" : "CVC words"} ·{" "}
                        {given.length ? `Assigned ${given.length}×` : "Not assigned yet"}
                      </p>
                    </div>
                    {lesson.ai_status === "connected" && (
                      <span className="flex items-center gap-1 rounded-full bg-[#fdf6ec] px-2 py-1 text-[10px] font-extrabold uppercase text-[#8a6a12]">
                        <Sparkles className="h-3 w-3" /> Voice check ready
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setPreview(lesson)}
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => setAssigning(lesson)}
                      className="flex items-center gap-1 rounded-full bg-[#5bbf8a] px-3 py-1.5 text-[11px] font-extrabold text-white"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign
                    </button>
                  </div>
                  {given.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {given.map((a) => (
                        <li key={a.id} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#5b7f86] ring-1 ring-[#e2eef0]">
                          {a.audience === "all" ? "Whole class" : (a.student_names || []).join(", ")}
                          <button onClick={() => unassign(a)} aria-label="Remove assignment" className="text-[#a34c3f]">
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {legacy.length > 0 && (
          <div className="mt-4 border-t border-[#eef4f3] pt-3">
            <p className="text-[11px] font-extrabold uppercase text-[#9db6ba]">Your earlier lessons (read-only)</p>
            <ul className="mt-2 space-y-1">
              {legacy.map((lesson) => (
                <li key={lesson.id}>
                  <button onClick={() => setPreview(lesson)} className="flex w-full items-center gap-2 rounded-xl bg-[#f8fbfb] px-3 py-2 text-left">
                    <span className="font-display text-xs font-extrabold text-[#5b7f86]">{lesson.target}</span>
                    <span className="truncate text-xs font-bold text-[#2c4a52]">{lesson.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.values(MODULES).map((module) => (
          <div key={module.id} className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f7f6]">
                <BookOpen className="h-5 w-5 text-[#3f9c6b]" />
              </span>
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">{module.title}</h2>
                <p className="text-[11px] font-bold text-[#8aa8ac]">{module.subtitle}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {module.items.map((item) => {
                const completed = summaries.filter((student) =>
                  (module.id === "vowels" ? student.vowelMap : student.cvcMap).some(
                    (node) => node.key === item.key && node.state === "completed"
                  )
                ).length;
                return (
                  <div key={item.key} className="flex items-center gap-3 rounded-xl bg-[#f8fbfb] px-3 py-2">
                    <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-[#e6f7ee] font-display text-sm font-extrabold text-[#166534]">
                      {item.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-[#2c4a52]">
                        {module.id === "vowels" ? `${item.word} sound` : `${item.word}`}
                      </p>
                      <p className="text-[11px] font-bold text-[#8aa8ac]">{item.tip}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-[#7d9ba0] ring-1 ring-[#e2eef0]">
                      <Star className="h-3 w-3 fill-[#f5c451] text-[#f5c451]" />
                      {completed}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#9db6ba]">
              <Volume2 className="h-3.5 w-3.5" /> Each lesson: listen, match the picture, then 3 speaking trials
            </p>
          </div>
        ))}
      </div>

      {assigning && (
        <AssignDialog
          lesson={assigning}
          students={summaries}
          onClose={() => setAssigning(null)}
          onAssigned={async () => {
            setAssigning(null);
            await load();
          }}
        />
      )}

      {preview && <LessonPreviewDialog lesson={preview} students={summaries} onClose={() => setPreview(null)} />}
    </div>
  );
}
