import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ReadinessCheck from "@/components/lesson/ReadinessCheck";
import LetterDisplay from "@/components/lesson/LetterDisplay";
import AudioLesson from "@/components/lesson/AudioLesson";
import AgentPanel from "@/components/lesson/AgentPanel";
import CameraPanel from "@/components/lesson/CameraPanel";
import PracticeTrial from "@/components/lesson/PracticeTrial";
import LessonResult from "@/components/lesson/LessonResult";
import ConfirmLeaveModal from "@/components/kidz/ConfirmLeaveModal";
import { findLesson } from "@/lib/curriculum";
import { worldFor } from "@/lib/worlds";
import { readKioskStudent, recordResult, saveAssessment } from "@/lib/progress";
import { speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

const MAX_TRIALS = 3;

export default function Lesson() {
  const { module: moduleId, key } = useParams();
  const navigate = useNavigate();
  const lesson = useMemo(() => findLesson(moduleId, key), [moduleId, key]);

  const [student, setStudent] = useState(null);
  const [phase, setPhase] = useState("readiness");
  const [attempts, setAttempts] = useState([]);
  const [pending, setPending] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const timersRef = useRef([]);
  const pendingRef = useRef(null);
  const savedRef = useRef(false);

  useEffect(() => {
    const current = readKioskStudent();
    if (!current) {
      navigate("/identify");
      return;
    }
    setStudent(current);
    if (!lesson) navigate("/student");
  }, [lesson, navigate]);

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      stopSpeaking();
    },
    []
  );

  const special = Boolean(student?.special_needs);

  useEffect(() => {
    if (phase !== "practice" || !lesson) return undefined;
    const { module, item } = lesson;
    const rate = special ? 0.6 : 0.82;
    const intro =
      module.id === "vowels"
        ? `Listen carefully! This is the letter ${item.label}. ${item.label} says ${item.sound}. Now it's your turn!`
        : `Listen carefully! This is the word ${item.word}. ${item.onset}, ${item.vowel}, ${item.coda}. ${item.word}. Now it's your turn!`;
    const demo = module.id === "vowels" ? item.say : `${item.onset}, ${item.vowel}, ${item.coda}. ${item.word}!`;

    const id = window.setTimeout(() => {
      speak(intro, { rate, onEnd: () => window.setTimeout(() => speak(demo, { rate }), 200) });
    }, 600);
    return () => window.clearTimeout(id);
  }, [phase, lesson, special]);

  if (!lesson || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf8ec]">
        <p className="font-display text-xl font-extrabold text-[#2c4a52]">Getting your lesson ready…</p>
      </div>
    );
  }

  const { module, item } = lesson;
  const world = worldFor(module.id, item.key);
  const target = module.promptFor(item);
  const backToMap = () => navigate(`/student?open=${module.id}`);
  // Back buttons ask first; the lesson keeps running underneath until the child confirms.
  const askToLeave = () => setLeaveOpen(true);
  const leaveModal = (
    <ConfirmLeaveModal
      open={leaveOpen}
      variant="back"
      onConfirm={() => {
        setLeaveOpen(false);
        backToMap();
      }}
      onCancel={() => setLeaveOpen(false)}
    />
  );

  const instruction =
    module.id === "vowels"
      ? `Listen carefully! This is the letter ${item.label}. ${item.label} says /${item.sound}/. Then it's your turn!`
      : `Listen carefully! This word is ${item.word}. ${item.onset} – ${item.vowel} – ${item.coda}. Then it's your turn!`;

  const finish = (all, passed, stars) => {
    if (savedRef.current) return;
    savedRef.current = true;
    setOutcome({ stars, passed, attempts: all.length });
    setPhase("result");
    const best = all.length ? Math.max(...all.map((entry) => entry.accuracy || 0)) : 0;
    recordResult({
      student,
      moduleId: module.id,
      lessonKey: item.key,
      accuracy: best,
      passed,
      stars,
    }).catch(() => {});
  };

  const commit = (result) => {
    if (pendingRef.current?.trial !== result.trial) return;
    pendingRef.current = null;
    const next = [...attempts, result];
    setAttempts(next);
    setPending(null);
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    if (result.passed) {
      finish(next, true, Math.max(1, MAX_TRIALS + 1 - next.length));
      return;
    }
    if (next.length >= MAX_TRIALS) finish(next, false, 0);
  };

  const handleResult = (result) => {
    const trial = attempts.length + 1;
    const entry = { ...result, trial };
    pendingRef.current = entry;
    setPending(entry);

    saveAssessment({
      student,
      moduleId: module.id,
      lessonKey: item.key,
      target,
      trial,
      accuracy: result.accuracy,
      transcript: result.transcript,
      feedback: result.feedback,
      passed: Boolean(result.passed),
    }).catch(() => {});

    const praise = result.passed
      ? trial === 1
        ? "Excellent! You got it!"
        : "Great job! Let's continue!"
      : trial === 1
        ? "Almost there! Listen again!"
        : trial === 2
          ? "Let's try one more time!"
          : "You did your best!";

    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [window.setTimeout(() => speak(praise, { rate: special ? 0.7 : 0.92 }), 200)];

    if (result.passed) {
      timersRef.current.push(window.setTimeout(() => commit(entry), 2300));
    }
  };

  const retryLesson = () => {
    savedRef.current = false;
    pendingRef.current = null;
    setAttempts([]);
    setPending(null);
    setOutcome(null);
    setPhase("practice");
  };

  if (phase === "readiness") {
    return (
      <>
        <ReadinessCheck student={student} world={world} special={special} onReady={() => setPhase("practice")} onBack={askToLeave} />
        {leaveModal}
      </>
    );
  }

  return (
    <div className={cn("min-h-screen", special ? "bg-[#f4f3ee]" : "bg-[#f1f0f0]")}>
      <header className="sticky top-0 z-30 bg-[#10363e] px-3 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <button onClick={askToLeave} className="kz-btn gap-2 rounded-full bg-white/15 px-3.5 py-2.5 text-xs text-white sm:text-sm">
            <ArrowLeft className="h-4 w-4" /> My map
          </button>
          <div className="text-center">
            <p className="font-display text-[11px] font-extrabold uppercase tracking-wide text-[#8fd6cf] sm:text-xs">
              {world.world}
            </p>
            <p className="font-display text-base font-extrabold leading-none text-white sm:text-lg">
              {world.guide} {module.id === "vowels" ? `Vowel ${item.label}` : item.word}
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5d34a] text-lg">
            {student.avatar || "🙂"}
          </span>
        </div>
      </header>

      {phase === "result" ? (
        <LessonResult
          moduleId={module.id}
          item={item}
          stars={outcome?.stars ?? 0}
          attempts={outcome?.attempts ?? 0}
          special={special}
          onRetry={retryLesson}
          onMap={backToMap}
        />
      ) : (
        <main className="mx-auto max-w-[1250px] px-3 pb-8 pt-3 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[55fr_45fr] lg:items-start">
            <div className="space-y-3.5">
              <LetterDisplay moduleId={module.id} item={item} special={special} />
              <AudioLesson moduleId={module.id} item={item} special={special} />
              <AgentPanel world={world} instruction={instruction} special={special} />
            </div>

            <div className="space-y-3.5">
              <CameraPanel special={special} />
              <PracticeTrial
                moduleId={module.id}
                item={item}
                target={target}
                trial={Math.min(attempts.length + 1, MAX_TRIALS)}
                attempts={attempts}
                pending={pending}
                special={special}
                onResult={handleResult}
                onContinue={() => pending && commit(pending)}
                onReplay={() =>
                  speak(module.id === "vowels" ? item.say : `${item.onset}, ${item.vowel}, ${item.coda}. ${item.word}!`, {
                    rate: special ? 0.6 : 0.75,
                  })
                }
              />
              <p className="px-1 text-center text-[11px] font-bold text-[#93a3a3]">
                Your teacher can see your tries and stars. Your voice recording is only used to check your sound, then
                it is deleted.
              </p>
            </div>
          </div>
        </main>
      )}
      {leaveModal}
    </div>
  );
}
