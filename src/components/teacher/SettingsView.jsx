import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  ShieldCheck,
  MonitorSmartphone,
  Sun,
  Moon,
  Monitor,
  Contrast,
  Type,
  CreditCard,
  Loader2,
  Check,
  KeyRound,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TIMEZONES } from "@/lib/format";
import { cn } from "@/lib/utils";

function Section({ title, icon: Icon, tone = "text-[#5bbf8a]", children, hint }) {
  return (
    <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
      <h2 className={cn("flex items-center gap-2 font-display text-lg font-extrabold text-[#2c4a52]", tone)}>
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {hint && <p className="mt-1 text-[11px] font-bold text-[#8aa8ac]">{hint}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition",
        active ? "bg-[#b6d3ff] text-[#173a63] shadow-[0_3px_0_#96baf0]" : "bg-[#f1f7f6] text-[#5b7f86]"
      )}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fbfb] px-3 py-2.5">
      <span>
        <span className="block text-sm font-extrabold text-[#2c4a52]">{label}</span>
        <span className="text-[11px] font-bold text-[#8aa8ac]">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="h-6 w-6 rounded border-2 border-[#cfe3e0] accent-[#5bbf8a]"
      />
    </label>
  );
}

const selectClass =
  "mt-1 w-full rounded-xl border-2 border-[#e2eef0] px-3 py-2.5 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#5bbf8a]";

export default function SettingsView({ teacher, summaries, prefs, savePrefs, onLogout }) {
  const navigate = useNavigate();
  const [card, setCard] = useState({ linked: false, reader_connected: false });
  const [enrolling, setEnrolling] = useState(false);
  const [cardMessage, setCardMessage] = useState("");

  const loadCard = async () => {
    const response = await base44.functions.invoke("teacherRfid", { action: "card" }).catch(() => null);
    if (response?.data) setCard(response.data);
  };

  useEffect(() => {
    loadCard();
  }, []);

  useEffect(() => {
    if (!enrolling) return undefined;
    let active = true;
    const poll = async () => {
      const status = await base44.functions.invoke("teacherRfid", { action: "status" }).catch(() => null);
      if (!active) return;
      if (!status?.data?.reader_connected) {
        setCardMessage("Waiting for the RFID reader. Check the bridge on the kiosk, then tap a card.");
        return;
      }
      setCardMessage("Reader connected — please tap the card you want to link.");
      const tap = status.data.tap;
      if (!tap?.tap_id) return;
      const linked = await base44.functions.invoke("teacherRfid", {
        action: "enroll",
        tap_id: tap.tap_id,
      }).catch((error) => ({ data: { error: error?.response?.data?.error } }));
      if (!active) return;
      if (linked?.data?.linked) {
        setEnrolling(false);
        setCard({ linked: true, reader_connected: true });
        setCardMessage("Card linked. You can now tap it to sign in.");
      } else {
        setEnrolling(false);
        setCardMessage(linked?.data?.error || "That card could not be linked.");
      }
    };
    poll();
    const id = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [enrolling]);

  const unlink = async () => {
    if (!window.confirm("Unlink your RFID card from this teacher account?")) return;
    await base44.functions.invoke("teacherRfid", { action: "unlink" }).catch(() => {});
    setCard({ linked: false, reader_connected: card.reader_connected });
    setCardMessage("Card unlinked.");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">Settings</h1>
        <p className="text-sm font-bold text-[#8aa8ac]">Your teacher account, appearance and kiosk preferences.</p>
      </div>

      <Section title="Appearance / theme" icon={Sun} hint="Applies to your teacher dashboard only. Student learning screens keep their own SNED adaptations.">
        <div className="flex flex-wrap gap-2">
          <Chip active={prefs.theme === "light"} onClick={() => savePrefs({ theme: "light" })}>
            <Sun className="h-3.5 w-3.5" /> Light mode
          </Chip>
          <Chip active={prefs.theme === "dark"} onClick={() => savePrefs({ theme: "dark" })}>
            <Moon className="h-3.5 w-3.5" /> Dark mode
          </Chip>
          <Chip active={prefs.theme === "system"} onClick={() => savePrefs({ theme: "system" })}>
            <Monitor className="h-3.5 w-3.5" /> System default
          </Chip>
        </div>
      </Section>

      <Section title="Accessibility adjustments" icon={Type} tone="text-[#5b8fb9]">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Font size</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
              { value: "xlarge", label: "Extra large" },
            ].map((option) => (
              <Chip key={option.value} active={prefs.font_size === option.value} onClick={() => savePrefs({ font_size: option.value })}>
                {option.label}
              </Chip>
            ))}
          </div>
        </div>
        <Toggle
          label="High-contrast mode"
          hint="Stronger text and border contrast across the dashboard"
          checked={prefs.high_contrast}
          onChange={(value) => savePrefs({ high_contrast: value })}
        />
        <Toggle
          label="Dyslexic-friendly font"
          hint="Uses Atkinson Hyperlegible for clearer letter shapes"
          checked={prefs.dyslexic_font}
          onChange={(value) => savePrefs({ dyslexic_font: value })}
        />
        <p className="flex items-start gap-2 rounded-xl bg-[#f8fbfb] px-3 py-2 text-[11px] font-bold text-[#7d9ba0]">
          <Contrast className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          These are teacher-side preferences. Student SNED adaptations stay controlled by the advisory teacher’s SNED
          setting and are never overwritten here.
        </p>
      </Section>

      <Section title="Language & region" icon={MonitorSmartphone} tone="text-[#c08a1e]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Preferred language</span>
            <select value={prefs.language} onChange={(event) => savePrefs({ language: event.target.value })} className={selectClass}>
              <option value="en">English</option>
            </select>
            <span className="mt-1 block text-[11px] font-bold text-[#9db6ba]">More languages will appear here when available.</span>
          </label>
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Time zone</span>
            <select value={prefs.timezone} onChange={(event) => savePrefs({ timezone: event.target.value })} className={selectClass}>
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Date format</span>
            <select
              value={prefs.date_format}
              onChange={(event) => savePrefs({ date_format: event.target.value })}
              className={selectClass}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY/MM/DD">YYYY/MM/DD</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Time format</span>
            <select
              value={prefs.time_format}
              onChange={(event) => savePrefs({ time_format: event.target.value })}
              className={selectClass}
            >
              <option value="12">12-hour</option>
              <option value="24">24-hour</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="Account preferences" icon={ShieldCheck} tone="text-[#5b8fb9]">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
            <dt className="text-[10px] font-extrabold uppercase text-[#9db6ba]">Teacher name</dt>
            <dd className="text-sm font-extrabold text-[#2c4a52]">{teacher?.full_name || "—"}</dd>
          </div>
          <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
            <dt className="text-[10px] font-extrabold uppercase text-[#9db6ba]">Email</dt>
            <dd className="truncate text-sm font-extrabold text-[#2c4a52]">{teacher?.email || "—"}</dd>
          </div>
          <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
            <dt className="text-[10px] font-extrabold uppercase text-[#9db6ba]">Role</dt>
            <dd className="text-sm font-extrabold capitalize text-[#2c4a52]">{teacher?.role || "user"}</dd>
          </div>
          <div className="rounded-xl bg-[#f8fbfb] px-3 py-2">
            <dt className="text-[10px] font-extrabold uppercase text-[#9db6ba]">Advisory students</dt>
            <dd className="text-sm font-extrabold text-[#2c4a52]">{summaries.length}</dd>
          </div>
        </dl>

        <button
          onClick={() => navigate("/forgot-password")}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f1f7f6] px-4 py-3 text-xs font-extrabold text-[#5b7f86]"
        >
          <KeyRound className="h-4 w-4" /> Change password
        </button>

        <div className="rounded-xl bg-[#f8fbfb] px-3 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">
            <CreditCard className="h-3.5 w-3.5" /> RFID card
          </p>
          <p className="mt-1 text-sm font-extrabold text-[#2c4a52]">
            {card.linked ? "A card is linked to your account" : "No card linked yet"}
          </p>
          <p className="text-[11px] font-bold text-[#8aa8ac]">
            {card.reader_connected ? "RFID reader connected" : "RFID reader not connected"} · card numbers are stored only
            as secure hashes
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setEnrolling(true);
                setCardMessage("Looking for the RFID reader…");
              }}
              disabled={enrolling}
              className="flex items-center gap-1.5 rounded-full bg-[#b6d3ff] px-3 py-2 text-[11px] font-extrabold text-[#173a63] disabled:opacity-60"
            >
              {enrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
              {card.linked ? "Link a different card" : "Link my card"}
            </button>
            {card.linked && (
              <button
                onClick={unlink}
                className="rounded-full bg-[#ffe4e0] px-3 py-2 text-[11px] font-extrabold text-[#a34c3f]"
              >
                Unlink card
              </button>
            )}
            <button
              onClick={loadCard}
              className="rounded-full bg-[#f1f7f6] px-3 py-2 text-[11px] font-extrabold text-[#5b7f86]"
            >
              Refresh status
            </button>
          </div>
          {cardMessage && <p className="mt-2 text-[11px] font-bold text-[#7d9ba0]">{cardMessage}</p>}
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-[#f8fbfb] px-3 py-2 text-[11px] font-bold text-[#7d9ba0]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Students never sign in and never use RFID cards. They keep identifying themselves by name and section.
        </p>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ffe4e0] px-4 py-3.5 text-sm font-extrabold text-[#a34c3f]"
        >
          <LogOut className="h-4 w-4" /> Sign out of KidZonics
        </button>
      </Section>

      <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-[#2c4a52]">
          <MonitorSmartphone className="h-4 w-4 text-[#5bbf8a]" /> Kiosk display
        </h2>
        <p className="mt-2 text-xs font-bold leading-relaxed text-[#7d9ba0]">
          Designed for a tablet-sized touchscreen (768–1280px). Open the student screen in full screen mode on the kiosk
          and keep this teacher area on your own device.
        </p>
      </div>
    </div>
  );
}
