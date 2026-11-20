import { useEffect, useRef, useState } from "react";
import { X, Save, Sparkles, Upload, Loader2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StudentPhoto from "@/components/teacher/StudentPhoto";
import { cn } from "@/lib/utils";

const SECTIONS = ["Sampaguita", "Rosal", "Ilang-Ilang", "Gumamela"];
const STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
];

const EMPTY = {
  student_id: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  section: "",
  photo_uri: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_email: "",
  enrollment_status: "active",
  special_needs: false,
};

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] font-bold text-[#9db6ba]">{hint}</span>}
    </label>
  );
}

const inputClass =
  "mt-1 w-full rounded-xl border-2 border-[#e2eef0] px-4 py-2.5 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#5bbf8a]";

export default function StudentFormDialog({ open, student, teacher, canEditSned = true, onClose, onSave, busy = false }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (student) {
      const [firstFromName, ...rest] = (student.name || "").split(" ");
      setForm({
        student_id: student.student_id || "",
        first_name: student.first_name || firstFromName || "",
        middle_name: student.middle_name || "",
        last_name: student.last_name || (student.first_name ? "" : rest.join(" ")),
        section: student.section || "",
        photo_uri: student.photo_uri || "",
        guardian_name: student.guardian_name || "",
        guardian_phone: student.guardian_phone || "",
        guardian_email: student.guardian_email || "",
        enrollment_status: student.enrollment_status || "active",
        special_needs: Boolean(student.special_needs),
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [open, student]);

  if (!open) return null;

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await base44.integrations.Core.UploadPrivateFile({ file });
      if (result?.file_uri) set("photo_uri", result.file_uri);
    } catch {
      setError("We could not upload that picture. Please try a different image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = () => {
    const first = form.first_name.trim();
    const last = form.last_name.trim();
    if (!first || !last) {
      setError("First name and last name are required.");
      return;
    }
    if (!form.section.trim()) {
      setError("Student section is required.");
      return;
    }
    const name = [first, form.middle_name.trim(), last].filter(Boolean).join(" ");
    onSave({
      ...form,
      first_name: first,
      middle_name: form.middle_name.trim(),
      last_name: last,
      name,
      section: form.section.trim(),
      canEditSned,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123039]/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.8rem] border-4 border-white bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-[#2c4a52]">
              {student ? "Edit student" : "Add student"}
            </h2>
            <p className="text-xs font-bold text-[#8aa8ac]">
              {student ? "Changes appear in the Master list and student search" : "Added to your Master list"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-[#f1f7f6] p-2 text-[#5b7f86]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#f8fbfb] p-3">
          <StudentPhoto uri={form.photo_uri} name={form.first_name} className="h-16 w-16" rounded="rounded-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Profile picture</p>
            <p className="text-[11px] font-bold text-[#9db6ba]">A real photo of the student. Photos are stored privately.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-[#b6d3ff] px-3 py-1.5 text-[11px] font-extrabold text-[#173a63]"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {form.photo_uri ? "Replace photo" : "Upload photo"}
              </button>
              {form.photo_uri && (
                <button
                  type="button"
                  onClick={() => set("photo_uri", "")}
                  className="flex items-center gap-1.5 rounded-full bg-[#ffe4e0] px-3 py-1.5 text-[11px] font-extrabold text-[#a34c3f]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="First name">
              <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Middle name">
              <input value={form.middle_name} onChange={(e) => set("middle_name", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Last name">
              <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Student ID">
              <input value={form.student_id} onChange={(e) => set("student_id", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Student section">
              <input
                value={form.section}
                onChange={(e) => set("section", e.target.value)}
                placeholder="e.g. Sampaguita"
                className={inputClass}
              />
              <span className="mt-2 flex flex-wrap gap-1.5">
                {SECTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => set("section", option)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-extrabold",
                      form.section === option ? "bg-[#b6d3ff] text-[#173a63]" : "bg-[#f1f7f6] text-[#5b7f86]"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </span>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Parent / Guardian name">
              <input value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Contact number">
              <input
                value={form.guardian_phone}
                onChange={(e) => set("guardian_phone", e.target.value)}
                inputMode="tel"
                className={inputClass}
              />
            </Field>
            <Field label="Email (optional)">
              <input
                value={form.guardian_email}
                onChange={(e) => set("guardian_email", e.target.value)}
                inputMode="email"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Advisory teacher">
              <div className="mt-1 rounded-xl bg-[#f6faf9] px-4 py-2.5 text-sm font-extrabold text-[#4b6a72]">
                {student?.advisory_teacher_name || teacher?.full_name || "You"}
              </div>
            </Field>
            <Field label="Enrollment status">
              <select
                value={form.enrollment_status}
                onChange={(e) => set("enrollment_status", e.target.value)}
                className={inputClass}
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <label
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl bg-[#f6faf9] px-4 py-3",
              !canEditSned && "opacity-60"
            )}
          >
            <span>
              <span className="block text-sm font-extrabold text-[#2c4a52]">SNED classification</span>
              <span className="text-[11px] font-bold text-[#8aa8ac]">
                Calm, one-step-at-a-time learning screen. Only the advisory teacher can change this.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.special_needs}
              disabled={!canEditSned}
              onChange={(e) => set("special_needs", e.target.checked)}
              className="h-6 w-6 rounded border-2 border-[#cfe3e0] accent-[#5bbf8a]"
            />
          </label>

          {error && <p className="rounded-xl bg-[#fdecec] px-3 py-2 text-xs font-bold text-[#b23a3a]">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-[#f1f7f6] px-4 py-3 text-sm font-extrabold text-[#5b7f86]">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || uploading}
            className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-[#5bbf8a] px-4 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#3f9c6b] disabled:opacity-60"
          >
            {busy ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
            {student ? "Save changes" : "Add to my class"}
          </button>
        </div>
      </div>
    </div>
  );
}
