"use client";

import { useRef, useState, useTransition } from "react";
import { loadDashboardRange } from "@/app/actions";
import { HistoryRuns } from "@/app/components/history-runs";
import { RangeTabs } from "@/app/components/range-tabs";
import { RunTestButton } from "@/app/components/run-test-button";
import { SpeedChart } from "@/app/components/speed-chart";
import { Triple } from "@/app/components/stats";
import { TermTip } from "@/app/components/term-tip";
import type { ChartPoint } from "@/lib/chart";
import type { Summary } from "@/lib/db";
import { homeHref } from "@/lib/runs";
import type { Range, SpeedTestRow } from "@/lib/types";

export function DashboardHistory({
  initialRange,
  initialSummary,
  initialChart,
  initialPreview,
  isp,
  serverName,
}: {
  initialRange: Range;
  initialSummary: Summary;
  initialChart: ChartPoint[];
  initialPreview: SpeedTestRow[];
  isp: string | null | undefined;
  serverName: string | null | undefined;
}) {
  const [range, setRange] = useState(initialRange);
  const [summary, setSummary] = useState(initialSummary);
  const [chart, setChart] = useState(initialChart);
  const [preview, setPreview] = useState(initialPreview);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);

  function selectRange(next: Range) {
    if (next === range) return;
    const id = requestId.current + 1;
    requestId.current = id;
    setRange(next);
    window.history.replaceState(window.history.state, "", homeHref(next));
    startTransition(async () => {
      const data = await loadDashboardRange(next);
      if (requestId.current !== id) return;
      setSummary(data.summary);
      setChart(data.chart);
      setPreview(data.preview);
    });
  }

  return (
    <>
      <section
        aria-busy={pending}
        className="flex min-w-0 flex-col gap-6 rounded-lg border border-hairline bg-raised px-5 py-6 sm:px-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-paper">History</h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              <TermTip term="minAvgMax">Min / avg / max</TermTip> from successful
              tests in this range
            </p>
          </div>
          <RangeTabs range={range} onSelect={selectRange} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Triple
            label="Down"
            stats={summary.download}
            unit="Mbps"
            term="download"
            unitTerm="mbps"
          />
          <Triple
            label="Up"
            stats={summary.upload}
            unit="Mbps"
            term="upload"
            unitTerm="mbps"
          />
          <Triple
            label="Ping"
            stats={summary.ping}
            unit="ms"
            term="ping"
            unitTerm="ms"
          />
        </div>
        <SpeedChart points={chart} range={range} />
        <div className="flex flex-col gap-4 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {isp ? (
              <>
                <TermTip term="isp">{isp}</TermTip>
                {serverName ? (
                  <>
                    {" · "}
                    <TermTip term="server">{serverName}</TermTip>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <TermTip term="isp">ISP</TermTip> unknown until a successful test
              </>
            )}
          </p>
          <RunTestButton />
        </div>
      </section>
      {preview.length > 0 ? <HistoryRuns tests={preview} range={range} /> : null}
    </>
  );
}
