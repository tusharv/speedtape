import { connection } from "next/server";
import { Suspense } from "react";
import { HistoryRuns } from "@/app/components/history-runs";
import { RunTestButton } from "@/app/components/run-test-button";
import { SpeedChart } from "@/app/components/speed-chart";
import { SpeedTape } from "@/app/components/speed-tape";
import {
  RangeTabs,
  Stat,
  Triple,
  formatMbps,
  formatMs,
  formatTime,
} from "@/app/components/stats";
import { loadDashboard } from "@/lib/dashboard";
import { parseRunQuery } from "@/lib/runs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    status?: string;
    slow?: string;
    ping?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  await connection();
  const params = await searchParams;
  const query = parseRunQuery(params);
  const range = query.range;
  const data = loadDashboard(range);
  const latestOk =
    data.latest && data.latest.error === null ? data.latest : null;
  const empty = data.tests.length === 0 && !data.latest;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-copper">
            House circuit
          </p>
          <h1 className="mt-2 font-display text-5xl text-paper sm:text-6xl">
            Home line
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Download, upload, and ping for this network. Hourly samples stay on
            the Mac even when this page is closed.
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>
            Hourly agent:{" "}
            <span className={data.agentLoaded ? "text-up" : "text-fail"}>
              {data.agentLoaded ? "loaded" : "not installed"}
            </span>
          </p>
          <p className="mt-1">Last reading {formatTime(data.latest?.testedAt)}</p>
        </div>
      </header>

      {empty ? (
        <section className="border border-dashed border-hairline bg-panel px-6 py-10">
          <h2 className="font-display text-3xl text-paper">No readings yet</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            Run a test now, or install the hourly agent so this house keeps a
            record while you are away from the dashboard.
          </p>
          <p className="mt-4 font-mono text-xs text-copper">
            npm run install-agent
          </p>
          <div className="mt-6">
            <RunTestButton />
          </div>
        </section>
      ) : null}

      <SpeedTape cells={data.tape} />

      {data.latest?.error && !latestOk ? (
        <p className="border border-fail/40 bg-fail/10 px-4 py-3 text-sm text-fail">
          Last test failed: {data.latest.error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Down"
          value={formatMbps(latestOk?.downloadMbps ?? null)}
          unit="Mbps"
        />
        <Stat
          label="Up"
          value={formatMbps(latestOk?.uploadMbps ?? null)}
          unit="Mbps"
        />
        <Stat
          label="Ping"
          value={formatMs(latestOk?.pingMs ?? null)}
          unit="ms"
        />
      </section>

      <section className="flex flex-col gap-4 border border-hairline bg-raised px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl text-paper">History</h2>
            <p className="mt-1 text-xs text-muted">
              Min / avg / max from successful tests in this range
            </p>
          </div>
          <RangeTabs query={query} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Triple label="Down" stats={data.summary.download} unit="Mbps" />
          <Triple label="Up" stats={data.summary.upload} unit="Mbps" />
          <Triple
            label="Ping"
            stats={data.summary.ping}
            unit="ms"
          />
        </div>
        <SpeedChart tests={data.tests} range={range} />
        <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {data.latest?.isp
              ? `${data.latest.isp}${data.latest.serverName ? ` · ${data.latest.serverName}` : ""}`
              : "ISP unknown until a successful test"}
          </p>
          <RunTestButton />
        </div>
      </section>

      {data.tests.length > 0 ? (
        <Suspense
          fallback={
            <section className="border border-dashed border-hairline bg-panel px-6 py-10 text-sm text-muted">
              Loading runs…
            </section>
          }
        >
          <HistoryRuns tests={data.tests} summary={data.summary} />
        </Suspense>
      ) : null}
    </div>
  );
}
