import type { ReactNode } from "react";
import { formatMbps, formatMs, formatTime } from "@/app/components/stats";
import { TermTip } from "@/app/components/term-tip";
import { formatRunId, runCardId } from "@/lib/runs";
import { formatSpeedtestError } from "@/lib/speedtest-error";
import type { SpeedTestRow } from "@/lib/types";
import type { TermKey } from "@/lib/terms";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BroadcastIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeIcon,
  PercentIcon,
  PulseIcon,
  WarningCircleIcon,
  WaveSineIcon,
} from "@phosphor-icons/react/ssr";

const iconProps = { size: 14, weight: "regular" as const, "aria-hidden": true };

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function detail(value: string | null): string {
  return value && value.length > 0 ? value : "—";
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  term,
  unitTerm,
  accent = false,
}: {
  icon: Icon;
  label: string;
  value: string;
  unit: string;
  term: TermKey;
  unitTerm: TermKey;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">
        <Icon {...iconProps} />
        <TermTip term={term}>{label}</TermTip>
      </p>
      <p
        className={`mt-2 font-display text-3xl leading-none ${
          accent ? "text-amber" : "text-paper"
        }`}
      >
        {value}
        <span className="ml-1 font-mono text-xs tracking-normal text-muted">
          <TermTip term={unitTerm}>{unit}</TermTip>
        </span>
      </p>
    </div>
  );
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: Icon;
  children: ReactNode;
}) {
  return (
    <p className="inline-flex min-w-0 items-center gap-1.5 text-xs leading-5 text-muted">
      <Icon {...iconProps} className="shrink-0 text-copper" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function RunCard({ test }: { test: SpeedTestRow }) {
  const failed = test.error !== null;
  const when = formatTime(test.testedAt);
  const runLabel = formatRunId(test.id);

  return (
    <article
      id={runCardId(test.id)}
      aria-label={`Run ${test.id}, ${failed ? "failed" : "ok"}, ${when}`}
      className="group relative flex h-full scroll-mt-6 flex-col border border-hairline bg-panel py-4 pl-5 pr-4 transition-colors hover:border-copper"
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-0.75 ${
          failed ? "bg-fail" : "bg-copper"
        }`}
      />

      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <ClockIcon {...iconProps} />
          <time dateTime={test.testedAt}>{when}</time>
        </p>
        <div className="flex items-center gap-2">
          <p className="border border-hairline bg-raised px-2 py-0.5 font-mono text-[11px] text-copper">
            <TermTip term="run">{runLabel}</TermTip>
          </p>
          {failed ? (
            <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-fail">
              <WarningCircleIcon {...iconProps} />
              <TermTip term="failed">Failed</TermTip>
            </p>
          ) : (
            <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-up">
              <CheckCircleIcon {...iconProps} />
              <TermTip term="ok">Ok</TermTip>
            </p>
          )}
        </div>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric
          icon={ArrowDownIcon}
          label="Down"
          value={formatMbps(test.downloadMbps)}
          unit="Mbps"
          term="download"
          unitTerm="mbps"
          accent={!failed}
        />
        <Metric
          icon={ArrowUpIcon}
          label="Up"
          value={formatMbps(test.uploadMbps)}
          unit="Mbps"
          term="upload"
          unitTerm="mbps"
        />
        <Metric
          icon={PulseIcon}
          label="Ping"
          value={formatMs(test.pingMs)}
          unit="ms"
          term="ping"
          unitTerm="ms"
        />
      </div>
      {failed ? (
        <p className="mt-auto border-t border-hairline pt-3 text-sm leading-6 text-fail">
          {formatSpeedtestError(test.error ?? "")}
        </p>
      ) : (
        <div className="mt-auto flex flex-col gap-2 border-t border-hairline pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Meta icon={WaveSineIcon}>
              <TermTip term="jitter">Jitter</TermTip>{" "}
              {formatMs(test.jitterMs)}{" "}
              <TermTip term="ms">ms</TermTip>
            </Meta>
            <Meta icon={PercentIcon}>
              <TermTip term="loss">Loss</TermTip>{" "}
              {formatPercent(test.packetLoss)}
            </Meta>
          </div>
          <Meta icon={BroadcastIcon}>
            <TermTip term="server">
              {detail(test.serverLocation)}
              {" · "}
              {detail(test.serverName)}
            </TermTip>
          </Meta>
          <Meta icon={GlobeIcon}>
            <TermTip term="isp">{detail(test.isp)}</TermTip>
          </Meta>
        </div>
      )}
    </article>
  );
}
