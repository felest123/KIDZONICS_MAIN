import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, CreditCard, CheckCircle2, LogIn, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { loginWithMfa, continueMfa } from "@/lib/authMfa";
import { cn } from "@/lib/utils";

export default function TeacherLogin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [reader, setReader] = useState("checking");
  const [recognised, setRecognised] = useState(null);
  const [unknown, setUnknown] = useState(false);
  const [password, setPassword] = useState("");
  const [manual, setManual] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const recognisedRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then(() => {
        if (active) navigate("/teacher", { replace: true });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (busyRef.current) return;
      const response = await base44.functions.invoke("teacherRfid", { action: "status" }).catch(() => null);
      if (!active) return;
      if (!response?.data) {
        setReader("offline");
        return;
      }
      setReader(response.data.reader_connected ? "connected" : "offline");
      const tap = response.data.tap;
      if (!tap?.tap_id || recognisedRef.current) return;

      busyRef.current = true;
      const consumed = await base44.functions.invoke("teacherRfid", {
        action: "consume",
        tap_id: tap.tap_id,
      }).catch(() => null);
      busyRef.current = false;
      if (!active) return;

      if (consumed?.data?.status === "unknown") {
        setUnknown(true);
        setRecognised(null);
        recognisedRef.current = null;
        return;
      }
      if (consumed?.data?.status === "authorized") {
        setUnknown(false);
        const current = await base44.auth.me().catch(() => null);
        if (current?.email === consumed.data.teacher_email) {
          window.location.href = "/teacher";
          return;
        }
        recognisedRef.current = consumed.data;
        setRecognised({
          name: consumed.data.teacher_name || "Teacher",
          email: consumed.data.teacher_email,
        });
      }
    };
    poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const authenticate = async (mail, pass) => {
    setError("");
    setBusy(true);
    try {
      const result = await loginWithMfa(mail.trim(), pass);
      if (result?.mfa_required) {
        await continueMfa(result, "/teacher");
        return;
      }
      window.location.href = "/teacher";
    } catch (err) {
      setError(err?.response?.data?.message || "We could not sign you in. Check your email and password.");
      setBusy(false);
    }
  };

  const signIn = (event) => {
    event.preventDefault();
    authenticate(email, password);
  };

  const submitCardLogin = (event) => {
    event.preventDefault();
    if (!recognised) return;
    authenticate(recognised.email, password);
  };

  const readerTone =
    reader === "connected"
      ? "bg-[#d7f5e3] text-[#166534]"
      : reader === "offline"
        ? "bg-[#ffe4e0] text-[#a34c3f]"
        : "bg-[#eef4f3] text-[#5b7f86]";

  const readerLabel =
    reader === "connected"
      ? "RFID reader connected"
      : reader === "offline"
        ? "RFID reader not connected"
        : "Looking for the RFID reader…";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#d9f0f5] to-[#fdf8ec]">
      <div className="px-4 py-4 sm:px-8">
        <button
          onClick={() => navigate("/")}
          className="kz-btn gap-2 rounded-full bg-white/85 px-5 py-3 text-sm text-[#2c4a52] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to KidZonics
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-[2rem] border-[6px] border-white bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(44,74,82,0.9)] sm:p-8">
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold text-[#0d6f74]">KidZonics</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-[#2c4a52]">Teacher sign in</h1>
            <p className="mt-1 text-sm font-bold text-[#8aa8ac]">Please tap your RFID card to log in.</p>
          </div>

          {checking ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#5bbf8a]" />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-extrabold", readerTone)}>
                <CreditCard className="h-3.5 w-3.5" /> {readerLabel}
              </div>

              <div className="rounded-[1.4rem] border-4 border-dashed border-[#cfe7e7] bg-[#f8fbfb] px-4 py-6 text-center">
                {recognised ? (
                  <>
                    <CheckCircle2 className="mx-auto h-10 w-10 text-[#3f9c6b]" />
                    <p className="mt-2 font-display text-lg font-extrabold text-[#2c4a52]">
                      Welcome, {recognised.name}!
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#8aa8ac]">
                      Card recognised. Enter your KidZonics password once on this device to finish signing in.
                    </p>
                    <form onSubmit={submitCardLogin} className="mt-3 space-y-2">
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        placeholder="Your KidZonics password"
                        className="w-full rounded-xl border-2 border-[#e2eef0] px-4 py-3 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#5bbf8a]"
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5bbf8a] px-4 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#3f9c6b] disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                        Continue to my dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecognised(null);
                          recognisedRef.current = null;
                          setPassword("");
                        }}
                        className="w-full text-center text-[11px] font-extrabold text-[#8aa8ac] underline underline-offset-4"
                      >
                        Not you? Tap another card
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <CreditCard className="mx-auto h-10 w-10 text-[#0d6f74]" />
                    <p className="mt-2 font-display text-base font-extrabold text-[#2c4a52]">
                      Please tap your RFID card to log in.
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#8aa8ac]">
                      Hold your teacher card on the reader near the kiosk. Cards belong to teachers and administrators
                      only.
                    </p>
                    {reader === "offline" && (
                      <p className="mt-2 rounded-xl bg-[#ffe4e0] px-3 py-2 text-[11px] font-bold text-[#a34c3f]">
                        The RFID reader is not connected, so a card tap cannot be checked right now. You can sign in with
                        your teacher account instead.
                      </p>
                    )}
                  </>
                )}
              </div>

              {unknown && (
                <p className="flex items-start gap-2 rounded-xl bg-[#ffe4e0] px-3 py-2 text-xs font-bold text-[#a34c3f]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Card not recognized. Please try again.
                </p>
              )}

              {error && (
                <p className="flex items-start gap-2 rounded-xl bg-[#fdecec] px-3 py-2 text-xs font-bold text-[#b23a3a]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}

              {!recognised && (
                <>
                  <button
                    onClick={() => setManual((value) => !value)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f1f7f6] px-4 py-3 text-xs font-extrabold text-[#5b7f86]"
                  >
                    <LogIn className="h-4 w-4" />
                    {manual ? "Hide teacher account sign in" : "Sign in with my teacher account instead"}
                  </button>

                  {manual && (
                    <form onSubmit={signIn} className="space-y-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        placeholder="teacher@school.edu"
                        className="w-full rounded-xl border-2 border-[#e2eef0] px-4 py-3 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#5bbf8a]"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-xl border-2 border-[#e2eef0] px-4 py-3 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#5bbf8a]"
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0d6f74] px-4 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#0a5559] disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                        Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="block w-full text-center text-xs font-extrabold text-[#0d8a6a] underline underline-offset-4"
                      >
                        Forgot your password?
                      </button>
                    </form>
                  )}
                </>
              )}

              <p className="rounded-xl bg-[#f6faf9] px-4 py-3 text-center text-[11px] font-bold leading-relaxed text-[#7d9ba0]">
                Students do not sign in and never use cards. They pick their name and section on the student screen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
