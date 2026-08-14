import { formatMbps } from "@/app/components/stats";
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
      className="border border-hairline bg-panel px-4 py-5 sm:px-6 rounded-lg"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="min-w-0 font-display text-2xl text-paper">
          <TermTip term="range24h">24hr History</TermTip>
        </h2>
        <p className="min-w-0 shrink text-right text-[11px] uppercase tracking-[0.18em] text-muted">
          <TermTip term="download">Avg download</TermTip>
          {" · one bar per hour"}
        </p>
      </div>
      <div className="flex min-w-0">
        {groups.map((group, index) => (
          <div
            key={`${group.part}-${group.startIndex}`}
            className={`@container min-w-0 overflow-hidden ${index > 0 ? "border-l border-hairline pl-1.5" : ""}`}
            style={{ flexGrow: group.count, flexBasis: 0 }}
          >
            <p className="break-words text-[10px] leading-tight uppercase tracking-wider text-muted">
              {DAY_PART_LABELS[group.part]}
            </p>
            <p className="mt-1 font-display text-[clamp(0.75rem,38cqw,1.5rem)] leading-none text-copper">
              {formatMbps(group.avgDownloadMbps)}
            </p>
            {group.avgDownloadMbps !== null ? (
              <p className="mt-0.5 font-mono text-[10px] leading-tight tracking-normal text-muted">
                Mbps
              </p>
            ) : null}
            <div className="mt-3 flex h-20 items-end gap-px">
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
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>24h ago</span>
        <span>now</span>
      </div>
    </section>
  );
}
