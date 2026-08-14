"use client";

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
import type { ChartPoint } from "@/lib/chart";
import type { Range } from "@/lib/types";
import { TermTip } from "@/app/components/term-tip";

function formatTick(iso: string, range: Range): string {
  const date = new Date(iso);
  if (range === "24h") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function SpeedChart({
  points,
  range,
  embedded = false,
}: {
  points: ChartPoint[];
  range: Range;
  embedded?: boolean;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center border border-dashed border-hairline bg-panel px-6 text-center text-sm text-muted">
        No readings in this range yet.
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "h-64"
          : "h-72 border border-hairline bg-panel px-2 py-4 sm:px-4"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#3d342b" strokeDasharray="3 6" />
          <XAxis
            dataKey="time"
            tickFormatter={(value: string) => formatTick(value, range)}
            tick={{ fill: "#8a7d6e", fontSize: 11 }}
            axisLine={{ stroke: "#3d342b" }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            yAxisId="speed"
            tick={{ fill: "#8a7d6e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            unit="M"
          />
          <YAxis
            yAxisId="ping"
            orientation="right"
            tick={{ fill: "#8a7d6e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            unit="ms"
          />
          <Tooltip
            contentStyle={{
              background: "#1a1714",
              border: "1px solid #3d342b",
              borderRadius: 0,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "#e8dcc8",
            }}
            labelFormatter={(value) =>
              new Date(String(value)).toLocaleString()
            }
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              if (name === "ping") return [`${n.toFixed(1)} ms`, "Ping"];
              return [`${n.toFixed(1)} Mbps`, name === "download" ? "Down" : "Up"];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#8a7d6e" }}
            formatter={(value) =>
              value === "download" ? (
                <TermTip term="download">Down</TermTip>
              ) : value === "upload" ? (
                <TermTip term="upload">Up</TermTip>
              ) : (
                <TermTip term="ping">Ping</TermTip>
              )
            }
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="download"
            stroke="#d4894a"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="upload"
            stroke="#7d9a86"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="ping"
            type="monotone"
            dataKey="ping"
            stroke="#e8b86d"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
