"use client";

import type { ChangeEvent } from "react";
import {
  ArrowDownIcon,
  CaretDownIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  ClockIcon,
  FadersIcon,
  FunnelIcon,
  PulseIcon,
  SortAscendingIcon,
  StackIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";
import type { ArchiveQuery, RunSort, RunStatus } from "@/lib/runs";
import { TermTip } from "@/app/components/term-tip";
import { kicker } from "@/app/components/chrome";

const icon = { size: 14, weight: "regular" as const, "aria-hidden": true };

const STATUSES: { value: RunStatus; label: string }[] = [
  { value: "all", label: "All runs" },
  { value: "ok", label: "Ok only" },
  { value: "failed", label: "Failed only" },
];

const SORTS: { value: RunSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "slowest-down", label: "Slowest download" },
  { value: "highest-ping", label: "Highest ping" },
];

const selectClass =
  "w-full min-w-0 appearance-none rounded-lg border border-hairline bg-panel py-2.5 pl-10 pr-10 font-sans text-sm leading-5 text-paper outline-none [color-scheme:inherit] hover:border-copper focus:border-copper";

function StatusIcon({ status }: { status: RunStatus }) {
  if (status === "ok") return <CheckCircleIcon {...icon} className="text-up" />;
  if (status === "failed") {
    return <WarningCircleIcon {...icon} className="text-fail" />;
  }
  return <StackIcon {...icon} className="text-copper" />;
}

function SortIcon({ sort }: { sort: RunSort }) {
  if (sort === "oldest") return <ClockCounterClockwiseIcon {...icon} />;
  if (sort === "slowest-down") return <ArrowDownIcon {...icon} />;
  if (sort === "highest-ping") return <PulseIcon {...icon} />;
  return <ClockIcon {...icon} />;
}

export function RunToolbar({
  query,
  onUpdate,
  slowEnabled,
  pingEnabled,
}: {
  query: ArchiveQuery;
  onUpdate: (patch: Partial<ArchiveQuery>) => void;
  slowEnabled: boolean;
  pingEnabled: boolean;
}) {
  function onStatus(event: ChangeEvent<HTMLSelectElement>) {
    onUpdate({ status: event.target.value as RunStatus });
  }

  function onSort(event: ChangeEvent<HTMLSelectElement>) {
    onUpdate({ sort: event.target.value as RunSort });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="flex min-w-0 flex-col gap-2">
        <span className={`inline-flex items-center gap-1.5 ${kicker}`}>
          <FunnelIcon {...icon} />
          Status
        </span>
        <span className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <StatusIcon status={query.status} />
          </span>
          <select
            value={query.status}
            onChange={onStatus}
            className={selectClass}
          >
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <CaretDownIcon
            {...icon}
            className="pointer-events-none absolute inset-y-0 right-3 my-auto text-muted"
          />
        </span>
      </label>

      <label className="flex min-w-0 flex-col gap-2">
        <span className={`inline-flex items-center gap-1.5 ${kicker}`}>
          <SortAscendingIcon {...icon} />
          Sort
        </span>
        <span className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-copper">
            <SortIcon sort={query.sort} />
          </span>
          <select value={query.sort} onChange={onSort} className={selectClass}>
            {SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <CaretDownIcon
            {...icon}
            className="pointer-events-none absolute inset-y-0 right-3 my-auto text-muted"
          />
        </span>
      </label>

      <fieldset className="flex min-w-0 flex-col gap-2 sm:col-span-2 lg:col-span-1">
        <legend className={`inline-flex items-center gap-1.5 ${kicker}`}>
          <FadersIcon {...icon} />
          Problems
        </legend>
        <div className="flex flex-wrap gap-2">
          <label
            title={
              slowEnabled
                ? "Show runs slower than the all-time average"
                : "Needs a download average"
            }
            className={`inline-flex min-w-0 items-center gap-2 rounded-lg border bg-panel px-3 py-2.5 text-sm ${
              slowEnabled
                ? "cursor-pointer border-hairline text-paper hover:border-copper"
                : "cursor-not-allowed border-hairline text-muted opacity-40"
            }`}
          >
            <input
              type="checkbox"
              checked={query.slow}
              disabled={!slowEnabled}
              onChange={() => onUpdate({ slow: !query.slow })}
              className="accent-copper"
            />
            <ArrowDownIcon {...icon} className="text-copper" />
            <TermTip term="slowDown">Slow down</TermTip>
          </label>
          <label
            title={
              pingEnabled
                ? "Show runs with ping above the all-time average"
                : "Needs a ping average"
            }
            className={`inline-flex min-w-0 items-center gap-2 rounded-lg border bg-panel px-3 py-2.5 text-sm ${
              pingEnabled
                ? "cursor-pointer border-hairline text-paper hover:border-copper"
                : "cursor-not-allowed border-hairline text-muted opacity-40"
            }`}
          >
            <input
              type="checkbox"
              checked={query.ping}
              disabled={!pingEnabled}
              onChange={() => onUpdate({ ping: !query.ping })}
              className="accent-copper"
            />
            <PulseIcon {...icon} className="text-copper" />
            <TermTip term="highPing">High ping</TermTip>
          </label>
        </div>
      </fieldset>
    </div>
  );
}
