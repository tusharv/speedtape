import type { ReactNode } from "react";
import { formatMbps, formatMs, formatTime } from "@/app/components/stats";
import { TapeMark, passSerial } from "@/app/components/tape-mark";
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
    <div className="min-w-0">
      <p className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        <Icon {...iconProps} className="shrink-0" />
        <TermTip term={term}>{label}</TermTip>
      </p>
      <p
        className={`mt-2 flex flex-wrap items-baseline gap-x-1 gap-y-1 break-words font-display text-xl leading-tight sm:text-3xl ${
          accent ? "text-amber" : "text-paper"
        }`}
      >
        <span>{value}</span>
        <span className="font-mono text-xs font-normal tracking-normal text-muted">
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
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

export function RunCard({ test }: { test: SpeedTestRow }) {
  const failed = test.error !== null;
  const when = formatTime(test.testedAt);
  const runLabel = formatRunId(test.id);
  const serial = passSerial(test.id);

  return (
    <article
      id={runCardId(test.id)}
      aria-label={`Run ${test.id}, ${failed ? "failed" : "ok"}, ${when}`}
      className={`run-card-ticket group relative flex h-full min-w-0 scroll-mt-6 flex-col overflow-hidden rounded-lg border border-hairline bg-panel px-5 py-6 pl-7 transition-colors hover:border-copper ${
        failed ? "run-card-ticket-void" : ""
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 ${
          failed ? "bg-fail" : "bg-copper"
        }`}
      />
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-0.75 ${
          failed ? "bg-fail" : "bg-copper"
        }`}
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted">
          <TapeMark className="h-3.5 w-3.5" />
          <ClockIcon {...iconProps} />
          <time dateTime={test.testedAt}>{when}</time>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-lg border border-hairline bg-raised px-2 py-1 font-mono text-[11px] text-copper">
            <TermTip term="run">{runLabel}</TermTip>
          </p>
          {failed ? (
            <p className="inline-flex items-center gap-1 rounded-lg border border-fail/40 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-fail">
              <WarningCircleIcon {...iconProps} />
              <TermTip term="failed">Failed</TermTip>
            </p>
          ) : (
            <p className="inline-flex items-center gap-1 rounded-lg border border-up/40 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-up">
              <CheckCircleIcon {...iconProps} />
              <TermTip term="ok">Ok</TermTip>
            </p>
          )}
        </div>
      </header>

      <div className="mt-5 grid min-w-0 grid-cols-3 gap-4">
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
        <p className="mt-auto min-w-0 break-words border-t border-hairline pt-4 text-sm leading-6 text-fail">
          {formatSpeedtestError(test.error ?? "")}
        </p>
      ) : (
        <div className="mt-auto flex flex-col gap-3 border-t border-hairline pt-4">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
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
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="run-card-tear min-w-0 flex-1" aria-hidden="true" />
        <p className="shrink-0 font-mono text-[9px] tracking-[0.16em] text-muted">
          {serial}
        </p>
      </div>
    </article>
  );
}
