import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import HomeView from "@/components/teacher/HomeView";
import ClassView from "@/components/teacher/ClassView";
import StudentProfileView from "@/components/teacher/StudentProfileView";
import LessonsView from "@/components/teacher/LessonsView";
import ReportsView from "@/components/teacher/ReportsView";
import StudentReportView from "@/components/teacher/StudentReportView";
import SettingsView from "@/components/teacher/SettingsView";
import ContactAdminView from "@/components/teacher/ContactAdminView";
import StudentFormDialog from "@/components/teacher/StudentFormDialog";
import { summarizeStudents } from "@/lib/teacher";
import useTeacherPrefs from "@/hooks/useTeacherPrefs";
import { FONT_ZOOM } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [students, setStudents] = useState([]);
  const [progress, setProgress] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [profileTab, setProfileTab] = useState("profile");
  const [reportId, setReportId] = useState(null);
  const [systemDark, setSystemDark] = useState(false);
  const [blocked, setBlocked] = useState(null);

  const { prefs, save: savePrefs } = useTeacherPrefs(me);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    setSystemDark(media.matches);
    const handler = (event) => setSystemDark(event.matches);
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, []);

  const loadClass = async (user) => {
    const [studentPage, progressPage, assessmentPage] = await Promise.all([
      base44.entities.Student.filter({}, { limit: 300, sort: "name" }),
      base44.entities.LessonProgress.filter({}, { limit: 500, sort: "-updated_date" }),
      base44.entities.Assessment.filter({}, { limit: 300, sort: "-created_date" }),
    ]);
    const mine = (studentPage?.items ?? []).filter(
      (student) => !student.advisory_teacher_email || student.advisory_teacher_email === user.email
    );
    const ids = new Set(mine.map((student) => student.id));
    setStudents(mine);
    setProgress((progressPage?.items ?? []).filter((record) => ids.has(record.student_id)));
    setAssessments((assessmentPage?.items ?? []).filter((result) => ids.has(result.student_id)));
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!active) return;
      if (!user) {
        navigate("/teacher/login", { replace: true });
        return;
      }
      setMe(user);
      // Accounts can be deactivated from the separate Admin application.
      const account = await base44.functions.invoke("teacherAccount", {}).catch(() => null);
      if (!active) return;
      if (account?.data?.status === "deactivated") {
        setBlocked({ reason: account.data.deactivated_reason || "" });
        setLoading(false);
        return;
      }
      try {
        await loadClass(user);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const summaries = useMemo(
    () => summarizeStudents(students, progress, assessments),
    [students, progress, assessments]
  );

  const focused = summaries.find((student) => student.id === focusId) || null;
  const reportStudent = summaries.find((student) => student.id === reportId) || null;

  const openStudent = (id, nextTab = "profile") => {
    setFocusId(id);
    setProfileTab(nextTab);
    setQuery("");
    setTab("class");
  };

  const saveStudent = async (values) => {
    if (!me) return;
    setSaving(true);
    try {
      const payload = { ...values };
      delete payload.canEditSned;
      await base44.functions.invoke("teacherStudents", {
        action: editing ? "update" : "create",
        student_id: editing?.id,
        student: payload,
      });
      await loadClass(me);
      setDialogOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecial = async (student) => {
    setBusyId(student.id);
    try {
      await base44.functions.invoke("teacherStudents", {
        action: "toggle_sned",
        student_id: student.id,
      });
      await loadClass(me);
    } finally {
      setBusyId("");
    }
  };

  const logout = async () => {
    await base44.auth.logout("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef7f4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5bbf8a]" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef7f4] p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl ring-1 ring-[#e2eef0]">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe4e0]">
            <ShieldOff className="h-8 w-8 text-[#a34c3f]" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-[#2c4a52]">This teacher account is deactivated</h1>
          <p className="mt-2 text-sm font-bold text-[#7d9ba0]">
            Please contact the school administrator to restore access. Your students and their records are kept safe.
          </p>
          {blocked.reason && <p className="mt-2 text-xs font-bold text-[#9db6ba]">Reason: {blocked.reason}</p>}
          <button onClick={logout} className="mt-6 w-full rounded-full bg-[#2c4a52] px-6 py-3 text-sm font-extrabold text-white">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark);

  return (
    <div
      className={cn(
        "teacher-shell min-h-screen bg-[#eef7f4] p-2 sm:p-4",
        dark && "teacher-dark",
        prefs.high_contrast && "teacher-contrast",
        prefs.dyslexic_font && "teacher-dyslexic"
      )}
      style={{ zoom: FONT_ZOOM[prefs.font_size] || 1 }}
    >
      <div className="mx-auto max-w-7xl rounded-[2rem] border-[6px] border-[#a7c9bc] bg-[#f8fbfb] p-3 shadow-[0_30px_60px_-45px_rgba(44,74,82,0.9)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <TeacherSidebar
            active={tab}
            onChange={(next) => {
              setTab(next);
              if (next !== "class") setFocusId(null);
              if (next !== "reports") setReportId(null);
            }}
            onLogout={logout}
            teacher={me}
          />

          <main className="min-w-0 flex-1">
            {tab === "home" && (
              <HomeView
                teacher={me}
                summaries={summaries}
                query={query}
                setQuery={setQuery}
                onOpenStudent={openStudent}
                onAdd={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
                onNavigate={setTab}
              />
            )}

            {tab === "class" &&
              (focused ? (
                <StudentProfileView
                  student={focused}
                  teacher={me}
                  busyId={busyId}
                  initialTab={profileTab}
                  prefs={prefs}
                  onBack={() => setFocusId(null)}
                  onEdit={(student) => {
                    setEditing(student);
                    setDialogOpen(true);
                  }}
                  onToggleSpecial={toggleSpecial}
                />
              ) : (
                <ClassView
                  summaries={summaries}
                  teacher={me}
                  prefs={prefs}
                  onAdd={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                  onEdit={(student) => {
                    setEditing(student);
                    setDialogOpen(true);
                  }}
                  onToggleSpecial={toggleSpecial}
                  onOpenStudent={openStudent}
                  busyId={busyId}
                />
              ))}

            {tab === "lessons" && <LessonsView teacher={me} summaries={summaries} />}

            {tab === "reports" &&
              (reportStudent ? (
                <StudentReportView
                  student={reportStudent}
                  prefs={prefs}
                  onBack={() => setReportId(null)}
                />
              ) : (
                <ReportsView
                  summaries={summaries}
                  assessments={assessments}
                  prefs={prefs}
                  onOpenStudent={(id) => {
                    setReportId(id);
                    setTab("reports");
                  }}
                />
              ))}

            {tab === "contact" && <ContactAdminView />}

            {tab === "settings" && (
              <SettingsView
                teacher={me}
                summaries={summaries}
                prefs={prefs}
                savePrefs={savePrefs}
                onLogout={logout}
              />
            )}
          </main>
        </div>
      </div>

      <StudentFormDialog
        open={dialogOpen}
        student={editing}
        teacher={me}
        canEditSned={!editing || !editing.advisory_teacher_email || editing.advisory_teacher_email === me?.email}
        busy={saving}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={saveStudent}
      />
    </div>
  );
}
