import { Mail, MapPin, Phone } from "lucide-react";
import Logo from "@/components/landing/Logo";

const CONTACT = [
  { icon: Phone, label: "Contact number", value: "(to be provided)" },
  { icon: Mail, label: "Email address", value: "(to be provided)" },
  { icon: MapPin, label: "Address", value: "(to be provided)" },
];

export default function LandingFooter() {
  return (
    <footer id="about" className="scroll-mt-24 bg-[#22434a] px-4 pb-8 pt-12 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo size="md" />
            <p className="mt-3 font-display text-lg font-extrabold text-[#fcd34d]">Read It!, Say It!, Learn It!</p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-white/70">
              KidZonics is an AI-powered phonics learning system designed to help kindergarten students develop early
              English reading and pronunciation skills through interactive learning activities.
            </p>
          </div>

          <div className="rounded-[1.4rem] bg-white/5 p-5">
            <h3 className="font-display text-base font-extrabold uppercase tracking-[0.16em] text-[#5fd4c8]">
              Contact
            </h3>
            <ul className="mt-3 space-y-2.5">
              {CONTACT.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex items-start gap-2 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#5fd4c8]" />
                    <span className="font-semibold leading-snug">
                      <span className="block text-[11px] font-extrabold uppercase tracking-wide text-white/45">
                        {item.label}
                      </span>
                      <span className="text-white/85">{item.value}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-[1.4rem] bg-white/5 p-5">
            <h3 className="font-display text-base font-extrabold uppercase tracking-[0.16em] text-[#5fd4c8]">
              About KidZonics
            </h3>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/75">
              A classroom phonics project focused on vowel recognition (A, E, I, O, U), CVC word reading, and
              pronunciation practice — with friendly feedback for every learner.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/15 pt-5 text-center">
          <p className="text-xs font-semibold text-white/55">© 2026 KidZonics. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
