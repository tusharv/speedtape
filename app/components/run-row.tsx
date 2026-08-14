import Link from "next/link";
import { formatMbps, formatMs, formatTime } from "@/app/components/stats";
import { TermTip } from "@/app/components/term-tip";
import { formatRunId, runDetailHref } from "@/lib/runs";
import { formatSpeedtestError } from "@/lib/speedtest-error";
import type { SpeedTestRow } from "@/lib/types";

export function RunRow({ test }: { test: SpeedTestRow }) {
  const failed = test.error !== null;
  const when = formatTime(test.testedAt);

  return (
    <Link
      href={runDetailHref(test.id)}
      aria-label={`Run ${test.id}, ${failed ? "failed" : "ok"}, ${when}`}
      className="flex flex-col gap-2 border border-hairline bg-panel px-4 py-3 hover:border-copper sm:flex-row sm:items-center sm:gap-4"
    >
      <p className="w-16 shrink-0 font-mono text-[11px] text-copper">
        <TermTip term="run">{formatRunId(test.id)}</TermTip>
      </p>
      <time
        dateTime={test.testedAt}
        className="w-36 shrink-0 text-xs text-muted"
      >
        {when}
      </time>
      {failed ? (
        <p className="min-w-0 flex-1 truncate text-sm text-fail">
          {formatSpeedtestError(test.error ?? "")}
        </p>
      ) : (
        <p className="min-w-0 flex-1 font-mono text-sm text-paper">
          <TermTip term="download" className="text-amber">
            {formatMbps(test.downloadMbps)}
          </TermTip>
          <span className="text-muted"> / </span>
          <TermTip term="upload">{formatMbps(test.uploadMbps)}</TermTip>
          <span className="text-muted"> </span>
          <TermTip term="mbps" className="text-muted">
            Mbps
          </TermTip>
          <span className="text-muted"> · </span>
          <TermTip term="ping">{formatMs(test.pingMs)}</TermTip>
          <span className="text-muted"> </span>
          <TermTip term="ms" className="text-muted">
            ms
          </TermTip>
        </p>
      )}
      <p
        className={`shrink-0 text-[11px] uppercase tracking-[0.16em] ${
          failed ? "text-fail" : "text-up"
        }`}
      >
        <TermTip term={failed ? "failed" : "ok"}>
          {failed ? "Failed" : "Ok"}
        </TermTip>
      </p>
    </Link>
  );
}
