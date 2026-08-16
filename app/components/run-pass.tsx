"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PrinterIcon } from "@phosphor-icons/react/ssr";
import { ghostBtn, kicker } from "@/app/components/chrome";
import { SpeedChart } from "@/app/components/speed-chart";
import { formatMbps, formatMs, formatTime } from "@/app/components/stats";
import { TapeMark, passSerial } from "@/app/components/tape-mark";
import { runsToChartPoints } from "@/lib/chart";
import { formatOutageDuration, type OutageWindow } from "@/lib/outage";
import { formatRunId } from "@/lib/runs";
import { formatSpeedtestError } from "@/lib/speedtest-error";
import { APP_NAME } from "@/lib/site";
import { termText, type TermKey } from "@/lib/terms";
import type { SpeedTestRow } from "@/lib/types";

const printIcon = { size: 14, weight: "regular" as const, "aria-hidden": true };

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function detail(value: string | null): string {
  return value && value.length > 0 ? value : "—";
}

function PassField({
  term,
  label,
  value,
  hint,
  active,
  onInspect,
  align = "left",
  size = "display",
}: {
  term: TermKey;
  label: string;
  value: ReactNode;
  hint?: string;
  active: boolean;
  onInspect: (term: TermKey) => void;
  align?: "left" | "center";
  size?: "display" | "ticket";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onInspect(term)}
      onMouseEnter={() => onInspect(term)}
      onFocus={() => onInspect(term)}
      className={`min-w-0 rounded-lg border px-3 py-2.5 transition-[transform,background-color,border-color] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
        align === "center" ? "text-center" : "text-left"
      } ${
        active
          ? "border-copper bg-copper/10"
          : "border-transparent hover:border-hairline hover:bg-copper/5"
      }`}
    >
      <span className={`block ${kicker}`}>{label}</span>
      <span
        className={`mt-1.5 block wrap-break-word leading-tight text-paper ${
          size === "ticket"
            ? "font-mono text-sm sm:text-base"
            : "font-display text-xl sm:text-2xl"
        }`}
      >
        {value}
      </span>
      {hint ? (
        <span className="mt-1 block truncate font-mono text-[10px] text-muted">
          {hint}
        </span>
      ) : null}
    </button>
  );
}

function PassBars({ test }: { test: SpeedTestRow }) {
  const bars = useMemo(() => {
    const seed = `${test.id}${test.downloadMbps ?? 0}${test.uploadMbps ?? 0}${test.pingMs ?? 0}`;
    return seed.replace(/\D/g, "").padEnd(28, "31415926").slice(0, 36).split("");
  }, [test.downloadMbps, test.id, test.pingMs, test.uploadMbps]);

  return (
    <div className="flex h-9 items-end gap-px" aria-hidden="true">
      {bars.map((digit, index) => (
        <span
          key={index}
          className="bg-paper"
          style={{
            width: `${digit === "0" ? 1 : 1 + (Number(digit) % 3)}px`,
            height: `${46 + Number(digit) * 5}%`,
          }}
        />
      ))}
    </div>
  );
}

export function RunPass({
  test,
  outage = null,
  neighbors = [],
}: {
  test: SpeedTestRow;
  outage?: OutageWindow | null;
  neighbors?: SpeedTestRow[];
}) {
  const failed = test.error !== null;
  const when = formatTime(test.testedAt);
  const runLabel = formatRunId(test.id);
  const serial = passSerial(test.id);
  const statusTerm: TermKey = failed ? "failed" : "ok";
  const [active, setActive] = useState<TermKey>(
    outage ? "wentDown" : statusTerm === "failed" ? "failed" : "download",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="run-pass-print flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className={ghostBtn}
        >
          <PrinterIcon {...printIcon} />
          Print
        </button>
      </div>

      <article
        aria-label={`Line pass ${test.id}, ${failed ? "void" : "cleared"}, ${when}`}
        className="run-pass relative flex flex-col overflow-hidden rounded-lg border border-hairline bg-panel md:flex-row"
      >
        <div className="relative flex min-w-0 flex-1">
          <div className="run-pass-sprocket hidden sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <header
            className={`flex flex-col ${
              failed ? "bg-fail text-ink" : "bg-copper text-ink"
            }`}
          >
            <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="flex items-end gap-2.5">
                <TapeMark tone="ink" className="mb-0.5 h-5 w-5" />
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.28em] opacity-80">
                    {APP_NAME}
                  </p>
                  <h1 className="font-display text-xl font-semibold uppercase tracking-[0.14em] sm:text-2xl">
                    Line pass {runLabel}
                  </h1>
                </div>
              </div>
              <p className="text-right font-mono text-[10px] uppercase tracking-[0.2em]">
                House reading
                <span className="mt-1 block tracking-[0.16em] opacity-80">
                  {serial}
                </span>
              </p>
            </div>
            <p className="run-pass-microprint" aria-hidden="true">
              SPEEDTAPE HOUSE LINE · {serial} · SPEEDTAPE HOUSE LINE · {serial} ·
              SPEEDTAPE HOUSE LINE · {serial}
            </p>
          </header>

          <div className="relative px-4 py-5 sm:px-5">
            <span className="run-pass-reg run-pass-reg-tl" aria-hidden="true" />
            <span className="run-pass-reg run-pass-reg-tr" aria-hidden="true" />
            <span className="run-pass-reg run-pass-reg-bl" aria-hidden="true" />
            <span className="run-pass-reg run-pass-reg-br" aria-hidden="true" />

            <div className="grid grid-cols-1 gap-3 border-b border-hairline pb-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              <PassField
                term="isp"
                label="From"
                value={detail(test.isp)}
                hint="this house"
                active={active === "isp"}
                onInspect={setActive}
              />
              <div
                data-pass-route="true"
                aria-hidden="true"
                className="hidden flex-col items-center justify-center px-1 sm:flex"
              >
                <span className="run-pass-route-line" />
                <TapeMark className="my-1 h-5 w-5" />
                <span className="run-pass-route-line" />
              </div>
              <PassField
                term="server"
                label="To"
                value={detail(test.serverLocation)}
                hint={detail(test.serverName)}
                active={active === "server"}
                onInspect={setActive}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-hairline py-4 sm:grid-cols-3">
              <PassField
                term="run"
                label="Issued"
                value={<time dateTime={test.testedAt}>{when}</time>}
                active={active === "run"}
                onInspect={setActive}
                size="ticket"
              />
              <PassField
                term={statusTerm}
                label="Status"
                value={failed ? "Void" : "Cleared"}
                active={active === statusTerm}
                onInspect={setActive}
                size="ticket"
              />
              <PassField
                term="run"
                label="Sample"
                value={runLabel}
                active={active === "run"}
                onInspect={setActive}
                size="ticket"
              />
            </div>

            {outage ? (
              <div className="grid grid-cols-1 gap-3 border-b border-hairline py-4 sm:grid-cols-3">
                <PassField
                  term="wentDown"
                  label="Went down"
                  value={
                    <time dateTime={outage.wentDownAt}>
                      {formatTime(outage.wentDownAt)}
                    </time>
                  }
                  active={active === "wentDown"}
                  onInspect={setActive}
                  size="ticket"
                />
                <PassField
                  term="restored"
                  label="Restored"
                  value={
                    outage.restoredAt ? (
                      <time dateTime={outage.restoredAt}>
                        {formatTime(outage.restoredAt)}
                      </time>
                    ) : (
                      "Still down"
                    )
                  }
                  active={active === "restored"}
                  onInspect={setActive}
                  size="ticket"
                />
                <PassField
                  term="outage"
                  label="Outage"
                  value={formatOutageDuration(
                    outage.wentDownAt,
                    outage.restoredAt,
                  )}
                  active={active === "outage"}
                  onInspect={setActive}
                  size="ticket"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-5">
              <PassField
                term="download"
                label="Down"
                value={
                  <>
                    {formatMbps(test.downloadMbps)}
                    <span className="ml-1 font-mono text-[10px] tracking-normal text-muted">
                      Mbps
                    </span>
                  </>
                }
                active={active === "download"}
                onInspect={setActive}
              />
              <PassField
                term="upload"
                label="Up"
                value={
                  <>
                    {formatMbps(test.uploadMbps)}
                    <span className="ml-1 font-mono text-[10px] tracking-normal text-muted">
                      Mbps
                    </span>
                  </>
                }
                active={active === "upload"}
                onInspect={setActive}
              />
              <PassField
                term="ping"
                label="Ping"
                value={
                  <>
                    {formatMs(test.pingMs)}
                    <span className="ml-1 font-mono text-[10px] tracking-normal text-muted">
                      ms
                    </span>
                  </>
                }
                active={active === "ping"}
                onInspect={setActive}
              />
              <PassField
                term="jitter"
                label="Jitter"
                value={
                  <>
                    {formatMs(test.jitterMs)}
                    <span className="ml-1 font-mono text-[10px] tracking-normal text-muted">
                      ms
                    </span>
                  </>
                }
                active={active === "jitter"}
                onInspect={setActive}
              />
              <PassField
                term="loss"
                label="Loss"
                value={formatPercent(test.packetLoss)}
                active={active === "loss"}
                onInspect={setActive}
              />
            </div>

            {failed ? (
              <p className="border-t border-fail/30 pt-4 text-sm leading-6 text-fail">
                {formatSpeedtestError(test.error ?? "")}
              </p>
            ) : null}

            <div className="mt-1 border-t border-hairline pt-4">
              <p className={kicker}>Remarks</p>
              <p
                aria-live="polite"
                className="mt-2 min-h-16 font-mono text-[11px] leading-5 text-paper"
              >
                {termText(active)}
              </p>
            </div>

            <div className="mt-4 border-t border-dashed border-hairline pt-4">
              <div className="run-pass-foil mb-4" aria-hidden="true" />
              <div className="flex items-end gap-3">
                <PassBars test={test} />
                {neighbors.length >= 2 ? (
                  <div className="min-w-0 flex-1">
                    <SpeedChart
                      points={runsToChartPoints(neighbors)}
                      range="24h"
                      highlightTime={test.testedAt}
                      sparkline
                    />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1" />
                )}
                <p className="shrink-0 pb-px font-mono text-[10px] tracking-[0.18em] text-muted">
                  {serial}
                </p>
              </div>
              <p className="mt-3 font-mono text-[9px] leading-4 tracking-[0.04em] text-muted">
                Valid for this sample only. Keep with the house record.
              </p>
            </div>
          </div>
          </div>
        </div>

        <div className="run-pass-perf-x md:hidden" aria-hidden="true" />
        <div className="run-pass-perf-y hidden md:block" aria-hidden="true" />

        <aside
          className={`relative flex flex-row items-stretch justify-between gap-4 px-5 py-5 md:w-44 md:flex-col md:justify-between ${
            failed ? "bg-fail/5" : "bg-copper/5"
          }`}
        >
          <div
            className={`run-pass-guilloche ${failed ? "opacity-50" : ""}`}
            aria-hidden="true"
          />
          <span
            className={`run-pass-stub-rail hidden md:block ${
              failed ? "bg-fail" : "bg-copper"
            }`}
            aria-hidden="true"
          />
          <div className="relative">
            <p className={kicker}>Pass</p>
            <p className="mt-2 font-display text-2xl leading-tight text-paper">
              {runLabel}
            </p>
            <p
              className={`mt-2 font-mono text-[10px] uppercase tracking-[0.18em] ${
                failed ? "text-fail" : "text-up"
              }`}
            >
              {failed ? "Void" : "Cleared"}
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-3 md:grid-cols-1">
            <PassField
              term="download"
              label="Down"
              value={formatMbps(test.downloadMbps)}
              active={active === "download"}
              onInspect={setActive}
              align="center"
            />
            <PassField
              term="upload"
              label="Up"
              value={formatMbps(test.uploadMbps)}
              active={active === "upload"}
              onInspect={setActive}
              align="center"
            />
            <PassField
              term="ping"
              label="Ping"
              value={formatMs(test.pingMs)}
              active={active === "ping"}
              onInspect={setActive}
              align="center"
            />
          </div>
        </aside>
      </article>
    </div>
  );
}
