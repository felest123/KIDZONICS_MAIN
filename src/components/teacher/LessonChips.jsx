import { cn } from "@/lib/utils";

export default function LessonChips({ map }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {map.map((node) => (
        <span
          key={node.key}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-extrabold",
            node.state === "completed"
              ? "bg-[#d7f5e3] text-[#166534]"
              : node.state === "current"
                ? "bg-[#fdf1dc] text-[#8a6a12] ring-2 ring-[#f2c97d]"
                : "bg-[#f1f5f5] text-[#9db6ba]"
          )}
          title={`${node.label} · ${node.state}`}
        >
          {node.label}
        </span>
      ))}
      {map.length === 0 && <span className="text-xs font-bold text-[#9db6ba]">No lessons yet</span>}
    </div>
  );
}
