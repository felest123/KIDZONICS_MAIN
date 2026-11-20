import { ArrowLeft, Check, Space } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function OnScreenKeyboard({ value = "", onChange, onClose, title = "Type here", suggestions = [], onPick }) {
  const press = (char) => onChange(`${value}${char}`.slice(0, 40));
  const backspace = () => onChange(value.slice(0, -1));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#123039]/50 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full max-w-3xl rounded-t-[2rem] border-t-4 border-white bg-[#f1fbfb] p-4 shadow-2xl sm:rounded-[2rem] sm:border-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-display text-lg font-extrabold text-[#2c4a52]">{title}</p>
          <button
            onClick={onClose}
            className="kz-btn bg-[#2c4a52] px-5 py-3 text-sm text-white"
            aria-label="Close keyboard"
          >
            Done
          </button>
        </div>

        <div className="mb-3 flex min-h-[58px] items-center rounded-2xl border-2 border-[#cfe7e7] bg-white px-4">
          <span className="truncate font-display text-2xl font-bold text-[#2c4a52]">
            {value || <span className="text-[#a9c4c8]">Start typing…</span>}
          </span>
          <span className="ml-0.5 h-6 w-[3px] animate-pulse bg-[#0d9488]" />
        </div>

        {suggestions.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestions.slice(0, 6).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onPick(suggestion)}
                className="kz-btn shrink-0 bg-[#fcd34d] px-4 py-2 text-sm text-[#2c4a52] shadow-[0_3px_0_#e0b324]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1.5 sm:gap-2">
              {row.map((char) => (
                <button
                  key={char}
                  onClick={() => press(char)}
                  className="kz-tap flex-1 rounded-xl border-2 border-b-4 border-[#c2dfe0] bg-white py-3 font-display text-xl font-bold text-[#2c4a52] transition active:translate-y-[2px] active:bg-[#e6f6f4] sm:text-2xl"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-center gap-2">
            <button
              onClick={backspace}
              className="kz-tap flex flex-[1.5] items-center justify-center rounded-xl border-2 border-b-4 border-[#e0b324] bg-[#fde68a] py-3 text-[#6b5514] transition active:translate-y-[2px]"
              aria-label="Delete last letter"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => press(" ")}
              className={cn(
                "kz-tap flex flex-[3] items-center justify-center gap-2 rounded-xl border-2 border-b-4 border-[#c2dfe0] bg-white py-3 font-display font-bold text-[#2c4a52] transition active:translate-y-[2px]"
              )}
            >
              <Space className="h-5 w-5" /> SPACE
            </button>
            <button
              onClick={onClose}
              className="kz-tap flex flex-[1.5] items-center justify-center rounded-xl border-2 border-b-4 border-[#0a6f66] bg-[#0d9488] py-3 text-white transition active:translate-y-[2px]"
              aria-label="Finish typing"
            >
              <Check className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
