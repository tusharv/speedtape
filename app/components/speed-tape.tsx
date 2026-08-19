import { kicker, sectionTitle } from "@/app/components/chrome";
import { formatMbps } from "@/app/components/stats";
import { SaveTapePng } from "@/app/components/save-tape-png";
import { TermTip } from "@/app/components/term-tip";
import {
  DAY_PART_LABELS,
  summarizeTapeGroups,
  tapeBarHeightPct,
  tapeBarMax,
  tapeBarTitle,
  type TapeCell,
} from "@/lib/tape";

function barFillClass(cell: TapeCell, isCurrent: boolean): string {
  if (cell.failed) return "bg-fail";
  if (cell.downloadMbps === null) return "bg-hairline";
  if (isCurrent) return "bg-amber";
  return "bg-copper";
}

export function SpeedTape({ cells }: { cells: TapeCell[] }) {
  const groups = summarizeTapeGroups(cells);
  const max = tapeBarMax(cells);
  const currentIndex = cells.length - 1;

  return (
    <section
      aria-label="Last 24 hours of download by time of day"
      className="min-w-0 overflow-x-clip rounded-lg border border-hairline bg-panel px-5 py-6 sm:px-6"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <h2 className={`min-w-0 ${sectionTitle}`}>
          <TermTip term="range24h">24hr History</TermTip>
        </h2>
        <div className="flex min-w-0 flex-col items-start gap-3 sm:items-end">
          <p className={`min-w-0 leading-snug sm:text-right ${kicker}`}>
            <TermTip term="download">Avg download</TermTip>
            {" · one bar per hour"}
          </p>
          <SaveTapePng cells={cells} />
        </div>
      </div>
      <div className="flex min-w-0 gap-0">
        {groups.map((group, index) => (
          <div
            key={`${group.part}-${group.startIndex}`}
            className={`@container min-w-0 overflow-hidden px-1.5 sm:px-2 ${index > 0 ? "border-l border-hairline" : "pl-0"}`}
            style={{ flexGrow: group.count, flexBasis: 0 }}
          >
            <p className="min-h-8 break-words text-[10px] leading-snug uppercase tracking-wide text-muted">
              {DAY_PART_LABELS[group.part]}
            </p>
            <p className="mt-2 font-display text-[clamp(0.75rem,38cqw,1.5rem)] leading-tight text-copper">
              {formatMbps(group.avgDownloadMbps)}
            </p>
            {group.avgDownloadMbps !== null ? (
              <p className="mt-1 font-mono text-[10px] leading-tight tracking-normal text-muted">
                Mbps
              </p>
            ) : null}
            <div className="mt-4 flex h-20 items-end gap-px">
              {group.cells.map((cell, cellIndex) => {
                const isCurrent =
                  group.startIndex + cellIndex === currentIndex;
                return (
                  <div
                    key={cell.hourStart}
                    title={tapeBarTitle(cell)}
                    className={`min-w-0 flex-1 ${barFillClass(cell, isCurrent)}`}
                    style={{ height: `${tapeBarHeightPct(cell, max)}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wide text-muted">
        <span>24h ago</span>
        <span>now</span>
      </div>
    </section>
  );
}
