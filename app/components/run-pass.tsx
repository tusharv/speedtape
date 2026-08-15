"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PrinterIcon } from "@phosphor-icons/react/ssr";
import { formatMbps, formatMs, formatTime } from "@/app/components/stats";
import { TapeMark, passSerial } from "@/app/components/tape-mark";
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
      className={`min-w-0 rounded-sm border px-2 py-2 transition-[transform,background-color,border-color] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
        align === "center" ? "text-center" : "text-left"
      } ${
        active
          ? "border-copper bg-copper/10"
          : "border-transparent hover:border-hairline hover:bg-copper/5"
      }`}
    >
      <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
        {label}
      </span>
      <span
        className={`mt-1 block wrap-break-word leading-tight text-paper ${
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

export function RunPass({ test }: { test: SpeedTestRow }) {
  const failed = test.error !== null;
  const when = formatTime(test.testedAt);
  const runLabel = formatRunId(test.id);
  const serial = passSerial(test.id);
  const statusTerm: TermKey = failed ? "failed" : "ok";
  const [active, setActive] = useState<TermKey>(statusTerm === "failed" ? "failed" : "download");

  return (
    <div className="flex flex-col gap-3">
      <div className="run-pass-print flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 border border-hairline px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted transition-[transform,color,border-color] hover:border-copper hover:text-paper active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
        >
          <PrinterIcon {...printIcon} />
          Print
        </button>
      </div>

      <article
        aria-label={`Line pass ${test.id}, ${failed ? "void" : "cleared"}, ${when}`}
        className="run-pass relative flex flex-col overflow-visible border border-hairline bg-panel md:flex-row"
      >
        <div className="relative flex min-w-0 flex-1">
          <div className="run-pass-sprocket hidden sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <header
            className={`flex flex-col ${
              failed ? "bg-fail text-ink" : "bg-copper text-ink"
            }`}
          >
            <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3 sm:px-5">
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

          <div className="relative px-3 py-4 sm:px-4">
            <span className="run-pass-reg run-pass-reg-tl" aria-hidden="true" />
            <span className="run-pass-reg run-pass-reg-tr" aria-hidden="true" />
            <span className="run-pass-reg run-pass-reg-bl" aria-hidden="true" />
            <span className="run-pass-reg run-pass-reg-br" aria-hidden="true" />
            <p
              aria-hidden="true"
              className={`pointer-events-none absolute right-4 top-3 rotate-[-11deg] border-2 px-2.5 py-0.5 font-display text-lg uppercase tracking-[0.22em] sm:right-6 sm:text-xl ${
                failed
                  ? "border-fail text-fail"
                  : "border-up text-up"
              }`}
            >
              {failed ? "Void" : "Cleared"}
            </p>

            <div className="grid grid-cols-2 gap-1 border-b border-hairline pb-3 pr-20 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:pr-28">
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

            <div className="grid grid-cols-3 gap-1 border-b border-hairline py-3">
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

            <div className="grid grid-cols-3 gap-1 py-3 sm:grid-cols-5">
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
              <p className="border-t border-fail/30 pt-3 text-sm leading-6 text-fail">
                {formatSpeedtestError(test.error ?? "")}
              </p>
            ) : null}

            <div className="mt-1 border-t border-hairline pt-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                Remarks
              </p>
              <p
                aria-live="polite"
                className="mt-1 min-h-16 font-mono text-[11px] leading-5 text-paper"
              >
                {termText(active)}
              </p>
            </div>

            <div className="mt-4 border-t border-dashed border-hairline pt-3">
              <div className="run-pass-foil mb-3" aria-hidden="true" />
              <div className="flex items-end justify-between gap-3">
                <PassBars test={test} />
                <p className="shrink-0 font-mono text-[10px] tracking-[0.18em] text-muted">
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
          className={`relative flex flex-row items-stretch justify-between gap-3 px-4 py-4 md:w-40 md:flex-col md:justify-between ${
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
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              Pass
            </p>
            <p className="mt-1 font-display text-2xl leading-none text-paper">
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
          <div className="relative grid grid-cols-3 gap-2 md:grid-cols-1">
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
