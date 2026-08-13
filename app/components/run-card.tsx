import { formatMbps, formatMs, formatTime } from "@/app/components/stats";
import type { SpeedTestRow } from "@/lib/types";

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function detail(value: string | null): string {
  return value && value.length > 0 ? value : "—";
}

export function RunCard({ test }: { test: SpeedTestRow }) {
  const failed = test.error !== null;

  return (
    <article className="border border-hairline bg-panel px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted">{formatTime(test.testedAt)}</p>
        {failed ? (
          <p className="text-[11px] uppercase tracking-[0.16em] text-fail">Failed</p>
        ) : null}
      </div>

      {failed ? (
        <p className="mt-3 text-sm leading-6 text-fail">{test.error}</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Down</p>
              <p className="mt-1 font-display text-3xl leading-none text-amber">
                {formatMbps(test.downloadMbps)}
                <span className="ml-1 font-mono text-xs tracking-normal text-muted">
                  Mbps
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Up</p>
              <p className="mt-1 font-display text-3xl leading-none text-paper">
                {formatMbps(test.uploadMbps)}
                <span className="ml-1 font-mono text-xs tracking-normal text-muted">
                  Mbps
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Ping</p>
              <p className="mt-1 font-display text-3xl leading-none text-paper">
                {formatMs(test.pingMs)}
                <span className="ml-1 font-mono text-xs tracking-normal text-muted">
                  ms
                </span>
              </p>
            </div>
          </div>
          <p className="mt-4 border-t border-hairline pt-3 text-xs leading-6 text-muted">
            Jitter {formatMs(test.jitterMs)} ms
            {" · "}
            Loss {formatPercent(test.packetLoss)}
            <br />
            {detail(test.serverLocation)}
            {" · "}
            {detail(test.serverName)}
            {" · "}
            {detail(test.isp)}
          </p>
        </>
      )}
    </article>
  );
}
