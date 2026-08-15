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
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-hairline bg-panel px-6 text-center text-sm leading-6 text-muted">
        No readings in this range yet.
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "h-64 min-w-0"
          : "h-72 min-w-0 overflow-x-clip rounded-lg border border-hairline bg-panel px-3 py-5 sm:h-80 sm:px-5"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 6" />
          <XAxis
            dataKey="time"
            tickFormatter={(value: string) => formatTick(value, range)}
            tick={{
              fill: "var(--muted)",
              fontSize: 11,
              fontFamily: "var(--font-sans)",
            }}
            axisLine={{ stroke: "var(--hairline)" }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            yAxisId="speed"
            tick={{
              fill: "var(--muted)",
              fontSize: 11,
              fontFamily: "var(--font-sans)",
            }}
            axisLine={false}
            tickLine={false}
            width={52}
            unit="M"
          />
          <YAxis
            yAxisId="ping"
            orientation="right"
            tick={{
              fill: "var(--muted)",
              fontSize: 11,
              fontFamily: "var(--font-sans)",
            }}
            axisLine={false}
            tickLine={false}
            width={44}
            unit="ms"
          />
          <Tooltip
            contentStyle={{
              background: "var(--raised)",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: "var(--paper)",
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
            wrapperStyle={{
              fontSize: 12,
              color: "var(--muted)",
              fontFamily: "var(--font-sans)",
              paddingTop: 12,
            }}
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
            stroke="var(--copper)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="upload"
            stroke="var(--amber)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="ping"
            type="monotone"
            dataKey="ping"
            stroke="var(--muted)"
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
