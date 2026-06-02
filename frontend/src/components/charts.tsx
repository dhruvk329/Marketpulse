import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { SentimentHistoryPoint, SentimentSummary } from "../types";

const POS = "#3fd17a";
const NEU = "#d6a64a";
const NEG = "#e5564e";

export function SentimentTrendChart({ data }: { data: SentimentHistoryPoint[] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    avg: d.avg_sentiment,
  }));

  if (chartData.length === 0)
    return <p className="py-10 text-center font-mono text-sm text-ash">No trend data yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={NEG} />
            <stop offset="50%" stopColor={NEU} />
            <stop offset="100%" stopColor={POS} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#232e33" strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8a9ba0", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={{ stroke: "#232e33" }}
          tickLine={false}
        />
        <YAxis
          domain={[-1, 1]}
          tick={{ fill: "#8a9ba0", fontSize: 11, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#11171a",
            border: "1px solid #232e33",
            borderRadius: 8,
            fontFamily: "JetBrains Mono",
            fontSize: 12,
            color: "#e8e6df",
          }}
          labelStyle={{ color: "#8a9ba0" }}
        />
        <ReferenceLine y={0} stroke="#3a484e" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="url(#lineG)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#0a0e0f", strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SentimentDonut({ summary }: { summary: SentimentSummary }) {
  const data = [
    { name: "Positive", value: summary.positive_count, color: POS },
    { name: "Neutral", value: summary.neutral_count, color: NEU },
    { name: "Negative", value: summary.negative_count, color: NEG },
  ].filter((d) => d.value > 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#11171a",
              border: "1px solid #232e33",
              borderRadius: 8,
              fontFamily: "JetBrains Mono",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-2xl font-bold"
          style={{
            color: summary.avg_sentiment > 0.05 ? POS : summary.avg_sentiment < -0.05 ? NEG : NEU,
          }}
        >
          {summary.avg_sentiment >= 0 ? "+" : ""}
          {summary.avg_sentiment.toFixed(2)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ash">
          avg score
        </span>
      </div>
    </div>
  );
}
