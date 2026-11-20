import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, User, ChevronRight, Users, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SkyScene from "@/components/kidz/SkyScene";
import OnScreenKeyboard from "@/components/kidz/OnScreenKeyboard";
import { setKioskStudent } from "@/lib/progress";

function Field({ label, value, placeholder, onOpen, icon: Icon }) {
  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-[1.5rem] border-4 border-[#cfe7e7] bg-white px-4 py-4 text-left transition hover:border-[#0d9488] focus:outline-none focus:ring-4 focus:ring-[#0d9488]/20 active:translate-y-[2px]"
    >
      <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#7d9ba0]">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span
        className={`mt-1 flex items-center justify-between font-display text-xl font-bold ${
          value ? "text-[#2c4a52]" : "text-[#b3c9cc]"
        }`}
      >
        {value || placeholder}
        <Search className="h-5 w-5 text-[#b3c9cc] transition group-hover:text-[#0d9488]" />
      </span>
    </button>
  );
}

export default function StudentIdentify() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Only names and sections: guardian details stay private to teachers and admins.
        const response = await base44.functions.invoke("kioskStudents", {});
        if (active) setStudents(response?.data?.students ?? []);
      } catch (err) {
        if (active) setLoadError("We could not reach the class list. Please ask your teacher for help.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const nameSuggestions = useMemo(() => {
    const query = name.trim().toLowerCase();
    const unique = [...new Set(students.map((s) => s.name))];
    if (!query) return unique.slice(0, 6);
    return unique.filter((n) => n.toLowerCase().includes(query)).slice(0, 6);
  }, [students, name]);

  const sections = useMemo(() => [...new Set(students.map((s) => s.section))].filter(Boolean), [students]);
  const sectionSuggestions = useMemo(() => {
    const query = section.trim().toLowerCase();
    if (!query) return sections;
    return sections.filter((s) => s.toLowerCase().includes(query));
  }, [sections, section]);

  const continueToLearn = () => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedSection = section.trim().toLowerCase();
    if (!trimmedName || !trimmedSection) {
      setError("Please choose your name and your section.");
      return;
    }
    const match = students.find(
      (student) =>
        student.name.trim().toLowerCase() === trimmedName && student.section.trim().toLowerCase() === trimmedSection
    );
    if (!match) {
      setError("We could not find that name and section together. Please check with your teacher.");
      return;
    }
    setError("");
    setKioskStudent(match);
    navigate("/student");
  };

  const activeSuggestions = editing === "name" ? nameSuggestions : sectionSuggestions;
  const activeValue = editing === "name" ? name : section;

  return (
    <SkyScene grassTall className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="kz-btn gap-2 rounded-full bg-white/90 px-5 py-3 text-sm text-[#2c4a52] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </button>
          <span className="font-display text-xl font-extrabold text-[#0e5f68]">KidZonics</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-[2.2rem] border-[6px] border-white bg-[#fdf8ec]/95 p-6 shadow-[0_24px_50px_-30px_rgba(44,74,82,0.9)] sm:p-9"
        >
          <div className="text-center">
            <h1 className="font-display text-4xl font-extrabold text-[#0e5f68] sm:text-5xl">Welcome!</h1>
            <p className="mt-2 text-sm font-bold text-[#5b7f86] sm:text-base">
              Tap your name and section to start learning.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Field
              label="Student name"
              icon={User}
              value={name}
              placeholder="Search student name"
              onOpen={() => setEditing("name")}
            />
            <Field
              label="Section"
              icon={Users}
              value={section}
              placeholder="Search student section"
              onOpen={() => setEditing("section")}
            />

            {(nameSuggestions.length > 0 || sectionSuggestions.length > 0) && !loading && (
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8aa8ac]">
                  Quick picks
                </p>
                <div className="flex flex-wrap gap-2">
                  {students.slice(0, 6).map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setName(student.name);
                        setSection(student.section);
                        setError("");
                      }}
                      className="kz-btn bg-white px-4 py-2 text-sm text-[#2c4a52] shadow-sm ring-1 ring-[#dceceb] hover:ring-[#0d9488]"
                    >
                      {student.avatar || "🙂"} {student.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading && <p className="mt-4 text-center text-sm font-bold text-[#7d9ba0]">Loading your class…</p>}

          {(error || loadError) && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#fdecec] px-4 py-3 text-sm font-bold text-[#b23a3a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error || loadError}
            </div>
          )}

          <button
            onClick={continueToLearn}
            disabled={loading}
            className="kz-btn mt-6 w-full rounded-full bg-[#0d9488] px-8 py-5 text-xl font-extrabold tracking-wide text-white shadow-[0_9px_0_#0a6f66] transition hover:brightness-105 active:translate-y-[4px] active:shadow-[0_4px_0_#0a6f66] disabled:opacity-60"
          >
            CONTINUE <ChevronRight className="h-6 w-6" />
          </button>

          <p className="mt-4 text-center text-xs font-semibold text-[#93aeb2]">
            Card tap coming soon — your teacher can connect an ID card.
          </p>
        </motion.div>
      </div>

      {editing && (
        <OnScreenKeyboard
          title={editing === "name" ? "Type your name" : "Type your section"}
          value={activeValue}
          onChange={editing === "name" ? setName : setSection}
          onClose={() => setEditing(null)}
          suggestions={activeSuggestions}
          onPick={(value) => {
            if (editing === "name") setName(value);
            else setSection(value);
            setEditing(null);
          }}
        />
      )}
    </SkyScene>
  );
}
