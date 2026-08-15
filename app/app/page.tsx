import Link from "next/link";
import { connection } from "next/server";
import { HistoryRuns } from "@/app/components/history-runs";
import { RunTestButton } from "@/app/components/run-test-button";
import { PageIntro, PageShell, SiteHeader } from "@/app/components/site-nav";
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
import { TermTip } from "@/app/components/term-tip";
import { loadDashboard } from "@/lib/dashboard";
import { parseRange } from "@/lib/range";
import { configHref } from "@/lib/runs";
import { formatAgentCount } from "@/lib/schedules";
import { formatSpeedtestError } from "@/lib/speedtest-error";

export const dynamic = "force-dynamic";
export const maxDuration = 240;
export const runtime = "nodejs";

export default async function Home({
  searchParams,
}: PageProps<"/app">) {
  await connection();
  const params = await searchParams;
  const range = parseRange(
    typeof params.range === "string" ? params.range : undefined,
  );
  const data = loadDashboard(range);
  const latestOk =
    data.latest && data.latest.error === null ? data.latest : null;
  const empty = data.preview.length === 0 && !data.latest;

  return (
    <PageShell>
      <SiteHeader current="home" />
      <PageIntro
        title="Dashboard"
        extra={
          <div className="text-left text-xs text-muted sm:text-right">
            <p>
              <TermTip term="agent">
                <Link
                  href={configHref()}
                  className={
                    data.agentsLoaded > 0
                      ? "text-up hover:underline"
                      : "text-fail hover:underline"
                  }
                >
                  {formatAgentCount(data.agentsLoaded)}
                </Link>
              </TermTip>
            </p>
            <p className="mt-1">
              Last reading {formatTime(data.latest?.testedAt)}
            </p>
          </div>
        }
      >
        Download, upload, and ping for this network. Scheduled samples stay on
        this computer even when this page is closed.
      </PageIntro>

      {empty ? (
        <section className="rounded-lg border border-dashed border-hairline bg-panel px-6 py-10">
          <h2 className="font-display text-3xl font-semibold text-paper">No readings yet</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            Run a test now, or open{" "}
            <Link href={configHref()} className="text-copper hover:underline">
              Config
            </Link>{" "}
            to add a collector so this house keeps a record while you are away
            from the dashboard.
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
          Last test failed: {formatSpeedtestError(data.latest.error)}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Down"
          value={formatMbps(latestOk?.downloadMbps ?? null)}
          unit="Mbps"
          term="download"
          unitTerm="mbps"
        />
        <Stat
          label="Up"
          value={formatMbps(latestOk?.uploadMbps ?? null)}
          unit="Mbps"
          term="upload"
          unitTerm="mbps"
        />
        <Stat
          label="Ping"
          value={formatMs(latestOk?.pingMs ?? null)}
          unit="ms"
          term="ping"
          unitTerm="ms"
        />
      </section>

      <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-hairline bg-raised px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-paper">History</h2>
            <p className="mt-1 text-xs text-muted">
              <TermTip term="minAvgMax">Min / avg / max</TermTip> from successful
              tests in this range
            </p>
          </div>
          <RangeTabs range={range} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Triple
            label="Down"
            stats={data.summary.download}
            unit="Mbps"
            term="download"
            unitTerm="mbps"
          />
          <Triple
            label="Up"
            stats={data.summary.upload}
            unit="Mbps"
            term="upload"
            unitTerm="mbps"
          />
          <Triple
            label="Ping"
            stats={data.summary.ping}
            unit="ms"
            term="ping"
            unitTerm="ms"
          />
        </div>
        <SpeedChart points={data.chart} range={range} />
        <div className="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {data.latest?.isp ? (
              <>
                <TermTip term="isp">{data.latest.isp}</TermTip>
                {data.latest.serverName ? (
                  <>
                    {" · "}
                    <TermTip term="server">{data.latest.serverName}</TermTip>
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

      {data.preview.length > 0 ? (
        <HistoryRuns tests={data.preview} />
      ) : null}
    </PageShell>
  );
}
