"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Granularity = "day" | "hour";

function formatTick(value: string, granularity: Granularity): string {
  if (granularity === "hour") {
    // "2026-05-04T09:00" -> "05-04 09"
    return value.slice(5, 10) + " " + value.slice(11, 13);
  }
  // "2026-05-04" -> "05-04"
  return value.slice(5);
}

export function TimeSeries({
  rows,
  xKey,
  granularity = "day",
}: {
  rows: Array<Record<string, string | number>>;
  xKey: string;
  granularity?: Granularity;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-56 w-full" aria-hidden />;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatTick(String(v), granularity)}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
