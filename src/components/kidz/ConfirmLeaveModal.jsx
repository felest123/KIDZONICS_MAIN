import { useEffect, useRef } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ArrowLeft, Home } from "lucide-react";

const VARIANTS = {
  back: {
    title: "Are you sure you want to go back?",
    confirm: "Yes, Go Back",
    Icon: ArrowLeft,
    tint: "bg-[#d9f0f5] text-[#0d6f74]",
  },
  home: {
    title: "Are you sure you want to go back to the home page?",
    confirm: "Yes, Go Home",
    Icon: Home,
    tint: "bg-[#fff3d6] text-[#d48a12]",
  },
};

/**
 * Shared "Are you sure?" popup for student Back / Home buttons.
 * Nothing happens until the child picks a button: "Cancel" only closes the
 * popup, so the current screen and its progress stay exactly as they were.
 */
export default function ConfirmLeaveModal({ open, variant = "back", onConfirm, onCancel }) {
  const { title, confirm, Icon, tint } = VARIANTS[variant] || VARIANTS.back;
  const leavingRef = useRef(false);

  useEffect(() => {
    if (open) leavingRef.current = false;
  }, [open]);

  const leave = () => {
    if (leavingRef.current) return; // a double tap must not navigate twice
    leavingRef.current = true;
    onConfirm();
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialog.Portal>
        {/* The overlay centres the card with flexbox, so the opening animation can never push it off-screen. */}
        <AlertDialog.Overlay className="fixed inset-0 z-[900] flex items-center justify-center overflow-y-auto bg-[#2c4a52]/55 p-4 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <AlertDialog.Content
            className="relative w-full max-w-md rounded-[2rem] border-4 border-white bg-gradient-to-b from-[#fffdf6] to-[#fdf3dc] p-6 text-center shadow-[0_24px_60px_-20px_rgba(44,74,82,0.7)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-8"
          >
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${tint}`} aria-hidden="true">
              <Icon className="h-10 w-10" strokeWidth={2.6} />
            </div>

            <AlertDialog.Title className="mt-4 font-display text-2xl font-extrabold leading-tight text-[#2c4a52] sm:text-3xl">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="sr-only">
              Choose {confirm} to leave, or Cancel to stay on this screen.
            </AlertDialog.Description>

            <div className="mt-6 flex flex-col gap-3">
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  onClick={leave}
                  className="kz-btn min-h-[3.75rem] w-full rounded-full bg-[#0d9488] px-6 py-4 text-xl text-white shadow-[0_6px_0_#0a6f66] active:translate-y-[3px] active:shadow-none"
                >
                  {confirm}
                </button>
              </AlertDialog.Action>
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  className="kz-btn min-h-[3.75rem] w-full rounded-full bg-[#fcd34d] px-6 py-4 text-xl text-[#2c4a52] shadow-[0_6px_0_#e0b324] active:translate-y-[3px] active:shadow-none"
                >
                  Cancel
                </button>
              </AlertDialog.Cancel>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Overlay>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
