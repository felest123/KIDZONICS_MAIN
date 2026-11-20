import { useEffect, useRef, useState } from "react";
import { X, Save, Loader2, Upload, Trash2, Sparkles, Users, UserRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SignedMedia from "@/components/teacher/SignedMedia";
import { cn } from "@/lib/utils";

const EMPTY = {
  title: "",
  description: "",
  category: "vowels",
  target: "",
  instructions: "",
  pronunciation_target: "",
  assessment_instructions: "",
  demo_audio_uri: "",
  demo_video_uri: "",
  illustration_uri: "",
  audience: "all",
  student_id: "",
  student_name: "",
  ai_prepared: false,
};

const inputClass =
  "mt-1 w-full rounded-xl border-2 border-[#e2eef0] px-4 py-2.5 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#5bbf8a]";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] font-bold text-[#9db6ba]">{hint}</span>}
    </label>
  );
}

function MediaUpload({ label, uri, kind, onChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const result = await base44.integrations.Core.UploadPrivateFile({ file });
      if (result?.file_uri) onChange(result.file_uri);
    } catch {
      setError("Upload failed. Please try a smaller file.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="rounded-xl bg-[#f8fbfb] p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex items-center gap-1.5 rounded-full bg-[#b6d3ff] px-3 py-1.5 text-[11px] font-extrabold text-[#173a63]"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uri ? "Replace file" : "Upload file"}
        </button>
        {uri && (
          <>
            <span className="text-[11px] font-extrabold text-[#3f9c6b]">Saved</span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex items-center gap-1 rounded-full bg-[#ffe4e0] px-2.5 py-1.5 text-[11px] font-extrabold text-[#a34c3f]"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </>
        )}
      </div>
      {uri && (
        <div className="mt-2">
          <SignedMedia uri={uri} kind={kind} />
        </div>
      )}
      {error && <p className="mt-1 text-[11px] font-bold text-[#b23a3a]">{error}</p>}
      <input
        ref={ref}
        type="file"
        accept={kind === "image" ? "image/*" : kind === "audio" ? "audio/*" : "video/*"}
        onChange={pick}
        className="hidden"
      />
    </div>
  );
}

export default function LessonFormDialog({ open, lesson, students = [], teacher, onClose, onSave, busy = false }) {
  const [form, setForm] = useState(EMPTY);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (lesson) {
      setForm({
        ...EMPTY,
        ...lesson,
        student_id: lesson.student_ids?.[0] || "",
        student_name: lesson.student_names?.[0] || "",
      });
    } else {
      setForm(EMPTY);
    }
    setQuery("");
    setError("");
  }, [open, lesson]);

  if (!open) return null;

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const matches = students.filter((student) =>
    `${student.name} ${student.section}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  const submit = () => {
    if (!form.title.trim()) {
      setError("Lesson title is required.");
      return;
    }
    if (!form.target.trim()) {
      setError("Add the target letter or CVC word.");
      return;
    }
    if (form.audience === "student" && !form.student_id) {
      setError("Choose the student who will receive this lesson.");
      return;
    }
    onSave({
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      target: form.target.trim(),
      instructions: form.instructions,
      pronunciation_target: form.pronunciation_target,
      assessment_instructions: form.assessment_instructions,
      demo_audio_uri: form.demo_audio_uri,
      demo_video_uri: form.demo_video_uri,
      illustration_uri: form.illustration_uri,
      audience: form.audience,
      student_ids: form.audience === "student" ? [form.student_id] : [],
      student_names: form.audience === "student" ? [form.student_name] : [],
      ai_prepared: form.ai_prepared,
      ai_status: form.ai_prepared ? "prepared" : "not_prepared",
      teacher_email: teacher?.email || "",
      teacher_name: teacher?.full_name || "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123039]/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.8rem] border-4 border-white bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-[#2c4a52]">
              {lesson ? "Edit lesson" : "Add lesson"}
            </h2>
            <p className="text-xs font-bold text-[#8aa8ac]">Saved to your class lesson library</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[#f1f7f6] p-2 text-[#5b7f86]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Lesson title">
              <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Lesson description">
              <input value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Learning category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                <option value="vowels">Vowels</option>
                <option value="cvc">CVC words</option>
              </select>
            </Field>
            <Field label="Target letter or CVC word">
              <input
                value={form.target}
                onChange={(e) => set("target", e.target.value.toUpperCase())}
                placeholder="e.g. A or CAT"
                className={inputClass}
              />
            </Field>
            <Field label="Pronunciation target">
              <input
                value={form.pronunciation_target}
                onChange={(e) => set("pronunciation_target", e.target.value)}
                placeholder="e.g. ah — short A"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Learning instructions">
            <textarea
              value={form.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>

          <Field label="Assessment instructions">
            <textarea
              value={form.assessment_instructions}
              onChange={(e) => set("assessment_instructions", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-2 sm:grid-cols-3">
            <MediaUpload label="Demonstration audio" kind="audio" uri={form.demo_audio_uri} onChange={(uri) => set("demo_audio_uri", uri)} />
            <MediaUpload label="Demonstration video" kind="video" uri={form.demo_video_uri} onChange={(uri) => set("demo_video_uri", uri)} />
            <MediaUpload label="Lesson illustration" kind="image" uri={form.illustration_uri} onChange={(uri) => set("illustration_uri", uri)} />
          </div>

          <div className="rounded-[1.3rem] bg-[#f8fbfb] p-3">
            <p className="font-display text-base font-extrabold text-[#2c4a52]">WHO WILL RECEIVE THIS LESSON?</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => set("audience", "all")}
                className={cn(
                  "flex items-start gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-extrabold transition",
                  form.audience === "all"
                    ? "bg-[#d7f5e3] text-[#166534] ring-2 ring-[#5bbf8a]"
                    : "bg-white text-[#5b7f86] ring-1 ring-[#e2eef0]"
                )}
              >
                <Users className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  All students
                  <span className="mt-0.5 block text-[11px] font-bold text-[#3f9c6b]">
                    Added to the {form.category === "vowels" ? "vowel" : "CVC"} module for every student
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => set("audience", "student")}
                className={cn(
                  "flex items-start gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-extrabold transition",
                  form.audience === "student"
                    ? "bg-[#e8f4ff] text-[#1e4b8a] ring-2 ring-[#b6d3ff]"
                    : "bg-white text-[#5b7f86] ring-1 ring-[#e2eef0]"
                )}
              >
                <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Specific student
                  <span className="mt-0.5 block text-[11px] font-bold text-[#5b8fb9]">
                    Only this student sees the lesson
                  </span>
                </span>
              </button>
            </div>

            {form.audience === "student" && (
              <div className="mt-2 rounded-xl bg-white p-2.5 ring-1 ring-[#e2eef0]">
                {form.student_id ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-extrabold text-[#2c4a52]">
                      {form.student_name} · {students.find((s) => s.id === form.student_id)?.section || ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        set("student_id", "");
                        set("student_name", "");
                      }}
                      className="rounded-full bg-[#f1f7f6] px-2.5 py-1 text-[11px] font-extrabold text-[#5b7f86]"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search the Master list"
                      className="w-full rounded-lg border-2 border-[#e2eef0] px-3 py-2 text-xs font-bold text-[#2c4a52] outline-none focus:border-[#b6d3ff]"
                    />
                    <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto">
                      {matches.slice(0, 20).map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => {
                            set("student_id", student.id);
                            set("student_name", student.name);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f1f7f6]"
                        >
                          <span className="text-xs font-extrabold text-[#2c4a52]">{student.name}</span>
                          <span className="text-[11px] font-bold text-[#8aa8ac]">{student.section}</span>
                        </button>
                      ))}
                      {matches.length === 0 && (
                        <p className="px-2 py-1 text-[11px] font-bold text-[#9db6ba]">No matching student.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[1.3rem] bg-[#fdf6ec] p-3">
            <p className="font-display text-base font-extrabold text-[#8a6a12]">AI AGENT LESSON INTEGRATION</p>
            <p className="mt-1 text-[11px] font-bold leading-relaxed text-[#a2843f]">
              The agent receives the lesson title, target letter or word, correct pronunciation, audio instructions,
              demonstration video, assessment criteria and learning instructions so it can guide students on the
              practice page.
            </p>
            <label className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={form.ai_prepared}
                onChange={(e) => set("ai_prepared", e.target.checked)}
                className="h-5 w-5 rounded border-2 border-[#e8d3aa] accent-[#c08a1e]"
              />
              <span className="text-xs font-extrabold text-[#8a6a12]">Prepare this lesson for the AI agent</span>
            </label>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] font-bold text-[#a2843f]">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The KidZonics AI agent is not connected in this workspace yet. Prepared lessons keep every field it needs;
              nothing is sent to an AI service.
            </p>
          </div>

          {error && <p className="rounded-xl bg-[#fdecec] px-3 py-2 text-xs font-bold text-[#b23a3a]">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-[#f1f7f6] px-4 py-3 text-sm font-extrabold text-[#5b7f86]">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-[#5bbf8a] px-4 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#3f9c6b] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {lesson ? "Save lesson" : "Add lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}
