import Link from "next/link";
import { RANGE_LABELS, RANGES } from "@/lib/range";
import { runHref, type RunQuery } from "@/lib/runs";
import type { MetricStats } from "@/lib/db";

function formatMbps(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function formatMs(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function formatTime(iso: string | undefined): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="border border-hairline bg-panel px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 font-display text-5xl leading-none text-amber">
        {value}
        <span className="ml-2 font-mono text-sm tracking-normal text-muted">
          {unit}
        </span>
      </p>
    </div>
  );
}

function Triple({
  label,
  stats,
  unit,
}: {
  label: string;
  stats: MetricStats;
  unit: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 text-sm text-paper">
        {formatMbps(stats.min)} / {formatMbps(stats.avg)} / {formatMbps(stats.max)}{" "}
        <span className="text-muted">{unit}</span>
      </p>
    </div>
  );
}

export function RangeTabs({ query }: { query: RunQuery }) {
  return (
    <nav aria-label="History range" className="flex gap-1">
      {RANGES.map((value) => {
        const active = value === query.range;
        return (
          <Link
            key={value}
            href={runHref({ ...query, range: value, page: 1 })}
            className={`border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${
              active
                ? "border-copper bg-copper text-ink"
                : "border-hairline text-muted hover:border-copper hover:text-paper"
            }`}
          >
            {RANGE_LABELS[value]}
          </Link>
        );
      })}
    </nav>
  );
}

export { formatMbps, formatMs, formatTime, Stat, Triple };
