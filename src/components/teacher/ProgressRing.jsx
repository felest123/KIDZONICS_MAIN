export default function ProgressRing({ value = 0, size = 132, label = "Class progress" }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 132 132" className="-rotate-90">
        <circle cx="66" cy="66" r={radius} fill="none" stroke="#e3f1ec" strokeWidth="14" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="#5bbf8a"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="-mt-[86px] mb-[26px] text-center">
        <p className="font-display text-3xl font-extrabold text-[#2c4a52]">{value}%</p>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8aa8ac]">{label}</p>
      </div>
    </div>
  );
}
