import { Pencil, Trash2, X, Sparkles } from "lucide-react";
import SignedMedia from "@/components/teacher/SignedMedia";
import { cn } from "@/lib/utils";

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#9db6ba]">{label}</p>
      <p className="whitespace-pre-line text-xs font-bold text-[#2c4a52]">{value || "—"}</p>
    </div>
  );
}

export default function LessonPreviewDialog({ lesson, students = [], onClose, onEdit, onRemove }) {
  const assigned = (lesson.student_ids || [])
    .map((id) => students.find((student) => student.id === id)?.name)
    .filter(Boolean);
  const names = assigned.length ? assigned : lesson.student_names || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123039]/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.8rem] border-4 border-white bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase",
                lesson.category === "vowels" ? "bg-[#fdf1dc] text-[#8a6a12]" : "bg-[#e8f4ff] text-[#1e4b8a]"
              )}
            >
              {lesson.category === "vowels" ? "Vowels" : "CVC words"}
            </span>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-[#2c4a52]">{lesson.title}</h2>
            <p className="text-xs font-bold text-[#8aa8ac]">Target: {lesson.target}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[#f1f7f6] p-2 text-[#5b7f86]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Detail label="Description" value={lesson.description} />
          <Detail label="Pronunciation target" value={lesson.pronunciation_target} />
          <Detail label="Learning instructions" value={lesson.instructions} />
          <Detail label="Assessment instructions" value={lesson.assessment_instructions} />
        </div>

        {(lesson.illustration_uri || lesson.demo_audio_uri || lesson.demo_video_uri) && (
          <div className="mt-3 space-y-2">
            <SignedMedia uri={lesson.illustration_uri} kind="image" />
            <SignedMedia uri={lesson.demo_audio_uri} kind="audio" />
            <SignedMedia uri={lesson.demo_video_uri} kind="video" />
          </div>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#9db6ba]">Who receives it</p>
            <p className="text-xs font-extrabold text-[#2c4a52]">
              {lesson.audience === "student"
                ? `Only ${names[0] || "one student"}`
                : "All students, in the " + (lesson.category === "vowels" ? "vowel" : "CVC") + " module"}
            </p>
          </div>
          <div className="rounded-xl bg-[#fdf6ec] px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[#c08a1e]">
              <Sparkles className="h-3 w-3" /> AI agent
            </p>
            <p className="text-xs font-extrabold text-[#8a6a12]">
              {lesson.ai_status === "connected"
                ? "Ready: the voice check can score this lesson"
                : lesson.ai_prepared
                  ? "Prepared, but the voice check cannot score this target yet"
                  : "Not prepared yet"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit && (
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#b6d3ff] px-4 py-2.5 text-xs font-extrabold text-[#173a63]"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit lesson
          </button>
          )}
          {onRemove && (
          <button
            onClick={onRemove}
            className="flex items-center justify-center gap-1.5 rounded-full bg-[#ffe4e0] px-4 py-2.5 text-xs font-extrabold text-[#a34c3f]"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
          )}
          <button onClick={onClose} className="rounded-full bg-[#f1f7f6] px-4 py-2.5 text-xs font-extrabold text-[#5b7f86]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
