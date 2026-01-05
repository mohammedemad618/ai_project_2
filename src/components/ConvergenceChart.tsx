"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ConvergencePoint } from "@/lib/algorithms";

export type ConvergenceSeries = {
  id: string;
  label: string;
  color: string;
  data: ConvergencePoint[];
};

const mergeSeries = (series: ConvergenceSeries[]) => {
  const map = new Map<number, Record<string, number>>();
  series.forEach((entry) => {
    entry.data.forEach((point) => {
      const existing = map.get(point.iteration) ?? { iteration: point.iteration };
      existing[entry.id] = point.distance;
      map.set(point.iteration, existing);
    });
  });
  return Array.from(map.values()).sort(
    (a, b) => (a.iteration as number) - (b.iteration as number)
  );
};

const ConvergenceChart = ({
  series,
  height = 280,
}: {
  series: ConvergenceSeries[];
  height?: number;
}) => {
  const data = mergeSeries(series);
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {series.map((entry) => (
              <linearGradient
                key={`${entry.id}-fill`}
                id={`${entry.id}-fill`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={entry.color} stopOpacity={0.32} />
                <stop offset="95%" stopColor={entry.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(17, 18, 20, 0.08)" />
          <XAxis dataKey="iteration" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              border: "1px solid #dfe3ea",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((entry) => (
            <Area
              key={entry.id}
              type="stepAfter"
              dataKey={entry.id}
              name={entry.label}
              stroke={entry.color}
              strokeWidth={3}
              strokeDasharray="6 6"
              fill={`url(#${entry.id}-fill)`}
              fillOpacity={0.18}
              dot={entry.data.length < 2 ? { r: 3 } : false}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConvergenceChart;
