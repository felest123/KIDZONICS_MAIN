import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Backpack, X } from "lucide-react";

export default function RoleModal({ open, onClose }) {
  const navigate = useNavigate();
  if (!open) return null;

  const choose = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#123039]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your role"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative w-full max-w-xl rounded-[2.2rem] border-[6px] border-white bg-[#fdf8ec] p-6 text-center shadow-2xl sm:p-9"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2c4a52] shadow-sm transition hover:bg-[#eaf7f5]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-display text-3xl font-extrabold tracking-wide text-[#2c4a52] sm:text-4xl">WHAT ROLE?</h2>
        <p className="mt-2 text-sm font-semibold text-[#5b7f86] sm:text-base">Choose how you want to enter KidZonics.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={() => choose("/identify")}
            className="kz-btn flex-1 flex-col gap-1 rounded-[1.6rem] bg-[#fcd34d] px-6 py-6 text-[#2c4a52] shadow-[0_8px_0_#e0b324] transition hover:brightness-105 active:translate-y-[3px] active:shadow-[0_4px_0_#e0b324]"
          >
            <Backpack className="h-8 w-8" />
            <span className="text-xl font-extrabold tracking-wide">STUDENT</span>
            <span className="text-xs font-bold text-[#7a6320]">Find my name</span>
          </button>

          <button
            onClick={() => choose("/teacher/login")}
            className="kz-btn flex-1 flex-col gap-1 rounded-[1.6rem] bg-[#0d9488] px-6 py-6 text-white shadow-[0_8px_0_#0a6f66] transition hover:brightness-105 active:translate-y-[3px] active:shadow-[0_4px_0_#0a6f66]"
          >
            <GraduationCap className="h-8 w-8" />
            <span className="text-xl font-extrabold tracking-wide">TEACHER</span>
            <span className="text-xs font-bold text-white/80">Sign in to my class</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
