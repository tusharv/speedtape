import { DAY_PART_LABELS, groupTapeDayParts, type TapeCell } from "@/lib/tape";
import { TermTip } from "@/app/components/term-tip";

function barHeight(cell: TapeCell, peak: number): string {
  if (cell.failed) return "18%";
  if (cell.downloadMbps === null || peak <= 0) return "6%";
  return `${Math.max(8, (cell.downloadMbps / peak) * 100)}%`;
}

export function SpeedTape({ cells }: { cells: TapeCell[] }) {
  const peak = Math.max(
    0,
    ...cells.map((cell) => cell.downloadMbps ?? 0),
  );

  return (
    <section
      aria-label="Last 24 hours of download speed"
      className="border border-hairline bg-panel px-4 py-5 sm:px-6"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl text-paper">
          <TermTip term="range24h">24h tape</TermTip>
        </h2>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          One cell per hour of{" "}
          <TermTip term="download">download</TermTip>
        </p>
      </div>
      <div className="flex h-28 items-stretch gap-px">
        {cells.map((cell) => (
          <div
            key={cell.hourStart}
            className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            title={
              cell.failed
                ? `${cell.label}: test failed`
                : cell.downloadMbps === null
                  ? `${cell.label}: no reading`
                  : `${cell.label}: ${cell.downloadMbps.toFixed(1)} Mbps`
            }
          >
            <div
              className={`w-full max-w-4 ${
                cell.failed
                  ? "bg-fail/80"
                  : cell.downloadMbps === null
                    ? "bg-hairline"
                    : "bg-copper"
              }`}
              style={{ height: barHeight(cell, peak) }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex text-[10px] uppercase tracking-wider text-muted">
        {groupTapeDayParts(cells).map((group, index) => (
          <span
            key={`${group.part}-${group.startIndex}`}
            className={`min-w-0 text-center ${
              index > 0 ? "border-l border-hairline" : ""
            }`}
            style={{ flexGrow: group.count, flexBasis: 0 }}
          >
            {DAY_PART_LABELS[group.part]}
          </span>
        ))}
      </div>
    </section>
  );
}
