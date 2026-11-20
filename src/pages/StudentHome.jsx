import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Star } from "lucide-react";
import FolderStack, { FOLDERS } from "@/components/kidz/FolderStack";
import AdventureMap from "@/components/kidz/AdventureMap";
import IceBreaker from "@/components/kidz/IceBreaker";
import ConfirmLeaveModal from "@/components/kidz/ConfirmLeaveModal";
import { worldFor } from "@/lib/worlds";
import { buildMap, completedCount, loadStudentProgress, readKioskStudent, clearKioskStudent } from "@/lib/progress";
import { cn } from "@/lib/utils";

export default function StudentHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState([]);
  const [active, setActive] = useState(null);
  const [view, setView] = useState("folders");
  const [notice, setNotice] = useState("");
  const [homeConfirmOpen, setHomeConfirmOpen] = useState(false);

  useEffect(() => {
    const current = readKioskStudent();
    if (!current) {
      navigate("/identify");
      return;
    }
    setStudent(current);
    loadStudentProgress(current.id)
      .then(setProgress)
      .catch(() => setProgress([]));

    const open = searchParams.get("open");
    if (open && FOLDERS.some((folder) => folder.id === open && folder.module)) {
      setActive(open);
      setView("map");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8ec]">
        <p className="font-display text-xl font-extrabold text-[#2c4a52]">Loading your folders…</p>
      </div>
    );
  }

  const special = Boolean(student.special_needs);
  const activeFolder = FOLDERS.find((folder) => folder.id === active) || null;
  const activeMap = activeFolder?.module ? buildMap(activeFolder.module, progress) : [];
  const totalDone = completedCount(buildMap("vowels", progress)) + completedCount(buildMap("cvc", progress));

  const progressByModule = {
    vowels: completedCount(buildMap("vowels", progress)),
    cvc: completedCount(buildMap("cvc", progress)),
  };

  const backToFolders = () => {
    setView("folders");
    setActive(null);
    setNotice("");
    if (searchParams.get("open")) setSearchParams({}, { replace: true });
  };

  const openNode = (node) => {
    if (node.state === "locked") {
      setNotice("Finish the lesson before this one to unlock it.");
      return;
    }
    navigate(`/student/lesson/${activeFolder.module}/${node.key}`);
  };

  const leaveStudent = () => {
    clearKioskStudent();
    navigate("/identify");
  };

  if (view === "game" && activeFolder?.module) {
    return (
      <IceBreaker
        moduleId={activeFolder.module}
        world={worldFor(activeFolder.module, activeMap[0]?.key)}
        muted={special}
        onComplete={() => setView("map")}
      />
    );
  }

  if (view === "map" && activeFolder?.module) {
    return (
      <AdventureMap
        moduleId={activeFolder.module}
        title={activeFolder.title}
        map={activeMap}
        muted={special}
        onSelect={openNode}
        onBack={backToFolders}
      />
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen",
        special ? "bg-[#f6f4ee]" : "bg-gradient-to-b from-[#cdeefb] via-[#e6f7fe] to-[#fdf8ec]"
      )}
    >
      <header className={cn("sticky top-0 z-30 px-3 py-3 sm:px-6", special ? "bg-[#3c6668]" : "bg-[#2c4a52]")}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <button
            onClick={() => (active ? backToFolders() : setHomeConfirmOpen(true))}
            className="kz-btn gap-2 rounded-full bg-white/15 px-4 py-3 text-sm text-white"
          >
            <ArrowLeft className="h-4 w-4" /> {active ? "Folders" : "Home"}
          </button>
          <span className="font-display text-lg font-extrabold text-[#5fd4c8] sm:text-2xl">KidZonics</span>
          <button
            onClick={leaveStudent}
            className="kz-btn gap-2 rounded-full bg-[#fcd34d] px-4 py-3 text-sm text-[#2c4a52]"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Switch</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 pb-16 pt-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border-4 border-white p-4 shadow-[0_18px_36px_-26px_rgba(44,74,82,0.9)] sm:p-5",
            special ? "bg-[#fbf9f2]" : "bg-white/85"
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-3xl text-2xl shadow-inner sm:h-16 sm:w-16 sm:text-3xl",
                special ? "bg-[#dbeae4]" : "bg-[#fcd34d]"
              )}
            >
              {student.avatar || "🙂"}
            </span>
            <div>
              <h1
                className={cn(
                  "font-display font-extrabold leading-tight text-[#2c4a52]",
                  special ? "text-2xl sm:text-3xl" : "text-2xl sm:text-4xl"
                )}
              >
                Welcome, {student.name.split(" ")[0]}!
              </h1>
              <p className="text-xs font-bold text-[#6b8a90] sm:text-sm">
                {student.section} · {totalDone} of 11 lessons done
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#eaf7f5] px-4 py-2">
            <Star className="h-5 w-5 fill-[#f59e0b] text-[#f59e0b]" />
            <span className="font-display text-sm font-extrabold text-[#2c4a52]">{totalDone} stars</span>
          </div>
        </motion.div>

        {special && (
          <p className="mt-3 rounded-2xl bg-[#e7efe9] px-4 py-2 text-center text-sm font-bold text-[#3f6b62]">
            Calm mode is on — take all the time you need. 💚
          </p>
        )}

        {notice && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#fff4d6] px-4 py-3 text-sm font-bold text-[#8a6a12]">
            {notice}
            <button onClick={() => setNotice("")} className="rounded-full bg-white/80 px-3 py-1 text-xs">
              Got it
            </button>
          </div>
        )}

        <section className="mt-5">
          <div className="mb-4 text-center">
            <h2 className="font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">My learning folders</h2>
            <p className="text-xs font-bold text-[#6b8a90] sm:text-sm">
              Tap a folder tab to open it. Yellow and turquoise folders are ready for you!
            </p>
          </div>

          <FolderStack
            activeId={active}
            muted={special}
            special={special}
            progressByModule={progressByModule}
            onSelect={(folder) => {
              setNotice("");
              setActive(folder.id);
            }}
            onStart={() => setView("game")}
            onBack={backToFolders}
          />
        </section>
      </main>
      <ConfirmLeaveModal
        open={homeConfirmOpen}
        variant="home"
        onConfirm={() => {
          setHomeConfirmOpen(false);
          navigate("/");
        }}
        onCancel={() => setHomeConfirmOpen(false)}
      />
    </div>
  );
}
