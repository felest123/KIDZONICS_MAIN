import { useEffect, useState } from "react";
import { LifeBuoy, Plus, Send, Loader2, ArrowLeft, ShieldCheck, UserRound, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export const CATEGORIES = [
  { id: "rfid_card", label: "RFID Card Problem" },
  { id: "account", label: "Account Assistance" },
  { id: "student_record", label: "Student Record Concern" },
  { id: "ai_agent", label: "AI Agent Problem" },
  { id: "lesson_request", label: "Lesson Management Request" },
  { id: "technical", label: "Technical Support" },
  { id: "other", label: "Other Concerns" },
];

const STATUS = {
  pending: { label: "Pending", className: "bg-[#fff3d6] text-[#8a6a12]" },
  in_progress: { label: "In Progress", className: "bg-[#e8f4ff] text-[#1e4b8a]" },
  resolved: { label: "Resolved", className: "bg-[#e6f7ee] text-[#166534]" },
};

const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || "Other Concerns";
const inputClass =
  "mt-1 w-full rounded-xl border-2 border-[#e2eef0] bg-white px-4 py-2.5 text-sm font-bold text-[#2c4a52] outline-none focus:border-[#5bbf8a]";

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase", s.className)}>{s.label}</span>;
}

function errorText(error, fallback) {
  return error?.response?.data?.error || fallback;
}

function NewRequestForm({ onSent, onCancel }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async (event) => {
    event.preventDefault();
    if (!subject.trim() || !category || !description.trim()) {
      setError("Please fill in the subject, category and description.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("teacherSupport", { action: "create", subject, category, description });
      onSent(response.data.request);
    } catch (err) {
      setError(errorText(err, "Your message could not be sent. Please try again."));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={send} className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">New message</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="rounded-full bg-[#f1f7f6] p-2 text-[#5b7f86]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Subject</span>
          <input className={inputClass} value={subject} maxLength={140} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. My RFID card stopped working" />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Message category</span>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Choose a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">Message description</span>
        <textarea
          className={cn(inputClass, "min-h-[120px]")}
          value={description}
          maxLength={4000}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the administrator what happened and what you need."
        />
      </label>
      {error && <p className="mt-2 text-xs font-bold text-[#a34c3f]">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#5bbf8a] px-5 py-3 text-xs font-extrabold text-white shadow-[0_4px_0_#3f9c6b] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </button>
      </div>
    </form>
  );
}

function Conversation({ request, onBack, onUpdated }) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sendFollowup = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("teacherSupport", { action: "followup", id: request.id, body: reply });
      setReply("");
      onUpdated(response.data.request);
    } catch (err) {
      setError(errorText(err, "Your message could not be sent."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-extrabold text-[#5b7f86]">
        <ArrowLeft className="h-4 w-4" /> All messages
      </button>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold text-[#2c4a52]">{request.subject}</h2>
          <p className="text-[11px] font-bold text-[#8aa8ac]">
            {categoryLabel(request.category)} · Sent {when(request.created_date)}
          </p>
        </div>
        <StatusChip status={request.status} />
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-[#f8fbfb] p-3">
          <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-[#8aa8ac]">
            <UserRound className="h-3 w-3" /> You · {when(request.created_date)}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm font-bold text-[#2c4a52]">{request.description}</p>
        </div>
        {(request.messages || []).map((message, index) => (
          <div
            key={index}
            className={cn(
              "rounded-2xl p-3",
              message.from === "admin" ? "ml-0 mr-6 bg-[#e8f4ff] sm:mr-16" : "ml-6 bg-[#f8fbfb] sm:ml-16"
            )}
          >
            <p
              className={cn(
                "flex items-center gap-1 text-[10px] font-extrabold uppercase",
                message.from === "admin" ? "text-[#1e4b8a]" : "text-[#8aa8ac]"
              )}
            >
              {message.from === "admin" ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
              {message.from === "admin" ? `Administrator${message.author_name ? ` · ${message.author_name}` : ""}` : "You"} ·{" "}
              {when(message.sent_at)}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm font-bold text-[#2c4a52]">{message.body}</p>
          </div>
        ))}
        {!(request.messages || []).some((m) => m.from === "admin") && (
          <p className="text-center text-xs font-bold text-[#9db6ba]">No reply from the administrator yet.</p>
        )}
      </div>

      <form onSubmit={sendFollowup} className="mt-4">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">
            {request.status === "resolved" ? "Write again (this re-opens the request)" : "Add a message"}
          </span>
          <textarea className={cn(inputClass, "min-h-[80px]")} value={reply} maxLength={4000} onChange={(e) => setReply(e.target.value)} />
        </label>
        {error && <p className="mt-2 text-xs font-bold text-[#a34c3f]">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={busy || !reply.trim()}
            className="flex items-center gap-1.5 rounded-full bg-[#5bbf8a] px-5 py-3 text-xs font-extrabold text-white shadow-[0_4px_0_#3f9c6b] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ContactAdminView() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    try {
      const response = await base44.functions.invoke("teacherSupport", { action: "list" });
      setRequests(response.data.requests || []);
      setError("");
    } catch (err) {
      setError(errorText(err, "Messages could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Pick up administrator replies while the page is open.
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, []);

  const upsert = (request) => setRequests((list) => [request, ...list.filter((r) => r.id !== request.id)]);
  const open = requests.find((r) => r.id === openId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-[#2c4a52] sm:text-3xl">
            <LifeBuoy className="h-6 w-6 text-[#5bbf8a]" /> Contact Administrator
          </h1>
          <p className="text-sm font-bold text-[#8aa8ac]">Send a concern to the school administrator and follow their replies here.</p>
        </div>
        {!composing && (
          <button
            onClick={() => {
              setComposing(true);
              setOpenId(null);
            }}
            className="flex items-center gap-1 rounded-full bg-[#5bbf8a] px-4 py-3 text-xs font-extrabold text-white shadow-[0_4px_0_#3f9c6b]"
          >
            <Plus className="h-4 w-4" /> NEW MESSAGE
          </button>
        )}
      </div>

      {composing && (
        <NewRequestForm
          onCancel={() => setComposing(false)}
          onSent={(request) => {
            upsert(request);
            setComposing(false);
            setOpenId(request.id);
          }}
        />
      )}

      {open ? (
        <Conversation request={open} onBack={() => setOpenId(null)} onUpdated={upsert} />
      ) : (
        <div className="rounded-[1.6rem] bg-white p-4 ring-1 ring-[#e2eef0]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-[#2c4a52]">Message history</h2>
            <span className="rounded-full bg-[#eef4f3] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#5b7f86]">
              {requests.length} sent
            </span>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#5bbf8a]" />
            </div>
          ) : error ? (
            <p className="mt-3 rounded-xl bg-[#ffe4e0] px-4 py-3 text-xs font-bold text-[#a34c3f]">{error}</p>
          ) : requests.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[#f8fbfb] px-4 py-8 text-center text-xs font-bold text-[#8aa8ac]">
              You have not sent any messages yet. Tap NEW MESSAGE if you need help from the administrator.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {requests.map((request) => {
                const last = (request.messages || []).at(-1);
                const newReply = request.last_message_from === "admin" && request.status !== "resolved";
                return (
                  <li key={request.id}>
                    <button
                      onClick={() => setOpenId(request.id)}
                      className="w-full rounded-[1.2rem] bg-[#f8fbfb] p-3 text-left transition hover:bg-[#eef6ff]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-[#2c4a52]">{request.subject}</p>
                        {newReply && (
                          <span className="rounded-full bg-[#1e4b8a] px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Reply</span>
                        )}
                        <StatusChip status={request.status} />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-bold text-[#8aa8ac]">
                        {categoryLabel(request.category)} · {when(request.last_message_at || request.created_date)}
                        {last ? ` · ${last.from === "admin" ? "Administrator" : "You"}: ${last.body}` : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
