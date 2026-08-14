import Link from "next/link";
import { TermTip } from "@/app/components/term-tip";
import { RANGE_LABELS, RANGES } from "@/lib/range";
import { homeHref } from "@/lib/runs";
import type { MetricStats } from "@/lib/db";
import type { TermKey } from "@/lib/terms";
import type { Range } from "@/lib/types";

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
  term,
  unitTerm,
}: {
  label: string;
  value: string;
  unit: string;
  term: TermKey;
  unitTerm: TermKey;
}) {
  return (
    <div className="border border-hairline bg-panel px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        <TermTip term={term}>{label}</TermTip>
      </p>
      <p className="mt-2 font-display text-5xl leading-none text-amber">
        {value}
        <span className="ml-2 font-mono text-sm tracking-normal text-muted">
          <TermTip term={unitTerm}>{unit}</TermTip>
        </span>
      </p>
    </div>
  );
}

function Triple({
  label,
  stats,
  unit,
  term,
  unitTerm,
}: {
  label: string;
  stats: MetricStats;
  unit: string;
  term: TermKey;
  unitTerm: TermKey;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        <TermTip term={term}>{label}</TermTip>
      </p>
      <p className="mt-1 text-sm text-paper">
        {formatMbps(stats.min)} / {formatMbps(stats.avg)} / {formatMbps(stats.max)}{" "}
        <span className="text-muted">
          <TermTip term={unitTerm}>{unit}</TermTip>
        </span>
      </p>
    </div>
  );
}

const RANGE_TERMS: Record<Range, TermKey> = {
  "24h": "range24h",
  "7d": "range7d",
  "30d": "range30d",
  all: "rangeAll",
};

export function RangeTabs({ range }: { range: Range }) {
  return (
    <nav aria-label="History range" className="flex gap-1">
      {RANGES.map((value) => {
        const active = value === range;
        return (
          <Link
            key={value}
            href={homeHref(value)}
            className={`border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${
              active
                ? "border-copper bg-copper text-white"
                : "border-hairline text-muted hover:border-copper hover:text-paper"
            }`}
          >
            <TermTip term={RANGE_TERMS[value]}>{RANGE_LABELS[value]}</TermTip>
          </Link>
        );
      })}
    </nav>
  );
}

export { formatMbps, formatMs, formatTime, Stat, Triple };
