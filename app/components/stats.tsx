import { kicker } from "@/app/components/chrome";
import { TermTip } from "@/app/components/term-tip";
import type { MetricStats } from "@/lib/db";
import type { TermKey } from "@/lib/terms";

function formatMbps(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function formatMs(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function detail(value: string | null): string {
  return value && value.length > 0 ? value : "—";
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
    <div className="min-w-0 rounded-lg border border-hairline bg-panel px-5 py-5">
      <p className={kicker}>
        <TermTip term={term}>{label}</TermTip>
      </p>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-display text-4xl leading-tight text-amber sm:text-5xl">
        <span>{value}</span>
        <span className="font-mono text-sm font-normal tracking-normal text-muted">
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
    <div className="min-w-0">
      <p className={kicker}>
        <TermTip term={term}>{label}</TermTip>
      </p>
      <p className="mt-2 text-sm leading-6 text-paper">
        {formatMbps(stats.min)} / {formatMbps(stats.avg)} / {formatMbps(stats.max)}{" "}
        <span className="text-muted">
          <TermTip term={unitTerm}>{unit}</TermTip>
        </span>
      </p>
    </div>
  );
}

export { RangeTabs } from "@/app/components/range-tabs";
export { formatMbps, formatMs, formatPercent, formatTime, detail, Stat, Triple };
