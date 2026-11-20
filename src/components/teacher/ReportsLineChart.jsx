import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { fontSize: 11, fontWeight: 700, fill: "#8aa8ac" };

export default function ReportsLineChart({ data, showVowels = true, single = false }) {
  if (!data.length) {
    return (
      <div className="mt-3 rounded-xl bg-[#f8fbfb] px-4 py-10 text-center text-xs font-bold text-[#8aa8ac]">
        No assessment records yet. The line graph fills in as students complete pronunciation checks.
      </div>
    );
  }

  return (
    <div className="mt-3 h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#eef4f3" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={AXIS} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2eef0", fontSize: 12, fontWeight: 700 }}
            labelStyle={{ color: "#2c4a52", fontWeight: 800 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 6 }} iconType="circle" iconSize={8} />
          {single ? (
            <Line
              type="monotone"
              dataKey="overall"
              name="Accuracy %"
              stroke="#5bbf8a"
              strokeWidth={3}
              dot={{ r: 3, fill: "#5bbf8a" }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="overall"
                name="All pronunciation checks"
                stroke="#5bbf8a"
                strokeWidth={3}
                dot={{ r: 3, fill: "#5bbf8a" }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              {showVowels && (
                <Line
                  type="monotone"
                  dataKey="vowels"
                  name="Vowel checks"
                  stroke="#5b8fb9"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#5b8fb9" }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )}
              <Line
                type="monotone"
                dataKey="cvc"
                name="CVC word checks"
                stroke="#c08a1e"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#c08a1e" }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
