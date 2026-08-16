"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
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

function highlightDot(
  color: string,
  highlightTime?: string,
  sparkline = false,
) {
  if (!highlightTime) return false;
  return function Dot({
    cx,
    cy,
    payload,
  }: {
    cx?: number;
    cy?: number;
    payload?: ChartPoint;
  }) {
    if (cx == null || cy == null) return null;
    const current = payload?.time === highlightTime;
    if (sparkline && !current) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={current ? (sparkline ? 3 : 5) : 2.5}
        fill={color}
        stroke={current ? "var(--paper)" : color}
        strokeWidth={current ? (sparkline ? 1 : 2) : 0}
      />
    );
  };
}

export function SpeedChart({
  points,
  range,
  embedded = false,
  sparkline = false,
  highlightTime,
}: {
  points: ChartPoint[];
  range: Range;
  embedded?: boolean;
  sparkline?: boolean;
  highlightTime?: string;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-hairline bg-panel px-6 text-center text-sm leading-6 text-muted">
        No readings in this range yet.
      </div>
    );
  }

  const frame = sparkline
    ? "h-9 min-w-0"
    : embedded
      ? "h-64 min-w-0"
      : "h-72 min-w-0 overflow-x-clip rounded-lg border border-hairline bg-panel px-3 py-5 sm:h-80 sm:px-5";

  return (
    <div
      className={frame}
      data-sparkline={sparkline ? "true" : undefined}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={
            sparkline
              ? { top: 6, right: 6, left: 6, bottom: 6 }
              : { top: 12, right: 16, left: 8, bottom: 8 }
          }
        >
          {sparkline ? null : (
            <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 6" />
          )}
          <XAxis
            dataKey="time"
            hide={sparkline}
            tickFormatter={(value: string) => formatTick(value, range)}
            tick={
              sparkline
                ? false
                : {
                    fill: "var(--muted)",
                    fontSize: 11,
                    fontFamily: "var(--font-sans)",
                  }
            }
            axisLine={sparkline ? false : { stroke: "var(--hairline)" }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            yAxisId="speed"
            hide={sparkline}
            tick={
              sparkline
                ? false
                : {
                    fill: "var(--muted)",
                    fontSize: 11,
                    fontFamily: "var(--font-sans)",
                  }
            }
            axisLine={false}
            tickLine={false}
            width={sparkline ? 0 : 52}
            unit={sparkline ? undefined : "M"}
          />
          <YAxis
            yAxisId="ping"
            orientation="right"
            hide={sparkline}
            tick={
              sparkline
                ? false
                : {
                    fill: "var(--muted)",
                    fontSize: 11,
                    fontFamily: "var(--font-sans)",
                  }
            }
            axisLine={false}
            tickLine={false}
            width={sparkline ? 0 : 44}
            unit={sparkline ? undefined : "ms"}
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
          {highlightTime && !sparkline ? (
            <ReferenceLine
              x={highlightTime}
              stroke="var(--copper)"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
            />
          ) : null}
          {sparkline ? null : (
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
          )}
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="download"
            stroke="var(--copper)"
            strokeWidth={sparkline ? 1.5 : 2}
            dot={highlightDot("var(--copper)", highlightTime, sparkline)}
            connectNulls={!highlightTime}
            isAnimationActive={!sparkline}
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="upload"
            stroke="var(--amber)"
            strokeWidth={sparkline ? 1.5 : 2}
            dot={highlightDot("var(--amber)", highlightTime, sparkline)}
            connectNulls={!highlightTime}
            isAnimationActive={!sparkline}
          />
          <Line
            yAxisId="ping"
            type="monotone"
            dataKey="ping"
            stroke="var(--muted)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={highlightDot("var(--muted)", highlightTime, sparkline)}
            connectNulls={!highlightTime}
            isAnimationActive={!sparkline}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
