import { Home, Users, BookOpen, BarChart3, Settings, LogOut, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "class", label: "Class", icon: Users },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "contact", label: "Contact Administrator", icon: LifeBuoy },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function TeacherSidebar({ active, onChange, onLogout, teacher }) {
  return (
    <aside className="lg:w-56 lg:shrink-0">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="font-display text-xl font-extrabold text-[#0d6f74]">KidZonics</span>
        <span className="rounded-full bg-[#b6d3ff] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#1e4b8a]">
          Teacher
        </span>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-2 no-scrollbar lg:flex-col lg:overflow-visible lg:pb-0">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold transition lg:w-full",
                isActive
                  ? "bg-[#b6d3ff] text-[#173a63] shadow-[0_4px_0_#96baf0]"
                  : "bg-white text-[#4b6a72] ring-1 ring-[#e2eef0] hover:bg-[#eef6ff]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="flex shrink-0 items-center gap-2 rounded-full bg-[#ffe4e0] px-4 py-3 text-sm font-extrabold text-[#a34c3f] transition lg:mt-2 lg:w-full"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </nav>

      {teacher && (
        <div className="mt-4 hidden rounded-2xl bg-white p-3 ring-1 ring-[#e2eef0] lg:block">
          <p className="truncate font-display text-sm font-extrabold text-[#2c4a52]">
            {teacher.full_name || "Teacher"}
          </p>
          <p className="truncate text-[11px] font-semibold text-[#8aa8ac]">{teacher.email}</p>
        </div>
      )}
    </aside>
  );
}
