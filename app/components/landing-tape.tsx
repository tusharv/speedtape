"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  landingHourReadout,
  tapeIndexFromClientX,
} from "@/lib/landing-tape";
import {
  DAY_PART_LABELS,
  dayPartForHour,
  summarizeTapeGroups,
  tapeBarHeightPct,
  tapeBarMax,
  type TapeCell,
} from "@/lib/tape";

function barFill(cell: TapeCell, selected: boolean): string {
  if (cell.failed) return selected ? "bg-fail" : "bg-fail/70";
  if (cell.downloadMbps === null) return "bg-hairline";
  if (selected) return "bg-amber";
  return "bg-copper";
}

function HourReadout({ cell }: { cell: TapeCell }) {
  const part = DAY_PART_LABELS[dayPartForHour(Number.parseInt(cell.label, 10))];
  const clock = `${cell.label}:00`;
  if (cell.failed) {
    return (
      <span>
        {part} {clock} failed
      </span>
    );
  }
  if (cell.downloadMbps === null) {
    return (
      <span>
        {part} {clock} no reading
      </span>
    );
  }
  return (
    <>
      <span>
        {part} {clock}
      </span>
      <span>{cell.downloadMbps.toFixed(1)} down</span>
      <span>{(cell.uploadMbps ?? 0).toFixed(1)} up</span>
      <span>{(cell.pingMs ?? 0).toFixed(1)} ping</span>
    </>
  );
}

export function LandingTape({ cells }: { cells: TapeCell[] }) {
  const groups = summarizeTapeGroups(cells);
  const max = tapeBarMax(cells);
  const trackRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [index, setIndex] = useState(cells.length - 1);
  const selected = cells[index] ?? cells[cells.length - 1];

  function setFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const next = tapeIndexFromClientX(clientX, rect.left, rect.width, cells.length);
    setIndex((current) => (current === next ? current : next));
  }

  function onPointer(event: PointerEvent<HTMLDivElement>) {
    setFromClientX(event.clientX);
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((current) => Math.min(cells.length - 1, current + 1));
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((current) => Math.max(0, current - 1));
    }
    if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setIndex(cells.length - 1);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 overflow-x-clip">
      <p
        id={labelId}
        className="flex min-w-0 flex-col gap-1 font-mono text-sm leading-6 text-paper sm:flex-row sm:flex-wrap sm:gap-x-4 sm:text-base"
      >
        {selected ? <HourReadout cell={selected} /> : null}
      </p>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={cells.length - 1}
        aria-valuenow={index}
        aria-valuetext={selected ? landingHourReadout(selected) : undefined}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onKeyDown={onKey}
        className="flex min-h-32 cursor-ew-resize touch-pan-y outline-none sm:min-h-40 focus-visible:ring-2 focus-visible:ring-copper"
      >
        {groups.map((group, groupIndex) => (
          <div
            key={`${group.part}-${group.startIndex}`}
            className={`flex min-w-0 flex-col justify-end overflow-hidden px-1.5 sm:px-2 ${groupIndex > 0 ? "border-l border-hairline" : "pl-0"}`}
            style={{ flexGrow: group.count, flexBasis: 0 }}
          >
            <p className="mb-3 min-h-8 break-words text-[10px] leading-snug uppercase tracking-wide text-muted">
              {DAY_PART_LABELS[group.part]}
            </p>
            <div className="flex h-28 items-end gap-px sm:h-44">
              {group.cells.map((cell, cellIndex) => {
                const absolute = group.startIndex + cellIndex;
                const selectedBar = absolute === index;
                return (
                  <div
                    key={cell.hourStart}
                    className={`landing-tape-bar min-w-0 flex-1 origin-bottom ${barFill(cell, selectedBar)}`}
                    style={{
                      height: `${tapeBarHeightPct(cell, max)}%`,
                      animationDelay: `${absolute * 18}ms`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-wide text-muted">
        <span>24h ago</span>
        <span>now</span>
      </div>
    </div>
  );
}
