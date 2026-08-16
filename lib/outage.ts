import type { SpeedTestRow } from "@/lib/types";

export const PREVIOUS_RUN_LIMIT = 5;

export type OutageWindow = {
  wentDownAt: string;
  restoredAt: string | null;
};

function isFailed(row: SpeedTestRow): boolean {
  return row.error !== null;
}

export function outageWindow(
  current: SpeedTestRow,
  orderedAsc: SpeedTestRow[],
): OutageWindow | null {
  if (!isFailed(current)) return null;

  const index = orderedAsc.findIndex((row) => row.id === current.id);
  if (index === -1) {
    return { wentDownAt: current.testedAt, restoredAt: null };
  }

  let start = index;
  while (start > 0) {
    const previous = orderedAsc[start - 1];
    if (!previous || !isFailed(previous)) break;
    start -= 1;
  }

  let end = index;
  while (end < orderedAsc.length - 1) {
    const next = orderedAsc[end + 1];
    if (!next || !isFailed(next)) break;
    end += 1;
  }

  const restored = orderedAsc.slice(end + 1).find((row) => !isFailed(row));
  const firstFail = orderedAsc[start];
  if (!firstFail) {
    return { wentDownAt: current.testedAt, restoredAt: restored?.testedAt ?? null };
  }

  return {
    wentDownAt: firstFail.testedAt,
    restoredAt: restored?.testedAt ?? null,
  };
}

export function formatOutageDuration(
  wentDownAt: string,
  restoredAt: string | null,
): string {
  if (restoredAt === null) return "Still down";
  const ms = new Date(restoredAt).getTime() - new Date(wentDownAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "Still down";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours < 48) {
    return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
  }
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours === 0 ? `${days}d` : `${days}d ${remainHours}h`;
}
