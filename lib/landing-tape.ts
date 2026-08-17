import {
  DAY_PART_LABELS,
  dayPartForHour,
  type TapeCell,
} from "@/lib/tape";
import type { SpeedTestRow } from "@/lib/types";

const START = Date.parse("2026-08-14T00:00:00.000Z");
const SAMPLE_DOWN = [
  42, 55, 60, 58, 80, 90, 88, 70, 40, 35, 38, 95, 110, 108, 100, 92, 85, 60, 22,
  18, 40, 70, 88, 96,
];

export function landingTapeCells(): TapeCell[] {
  return SAMPLE_DOWN.map((down, i) => {
    const failed = i === 18;
    return {
      hourStart: START + i * 60 * 60 * 1000,
      label: String(i).padStart(2, "0"),
      downloadMbps: failed ? null : down,
      uploadMbps: failed ? null : 12,
      pingMs: failed ? null : 9,
      failed,
    };
  });
}

export function landingHourReadout(cell: TapeCell): string {
  const hour = Number.parseInt(cell.label, 10);
  const part = DAY_PART_LABELS[dayPartForHour(hour)];
  const clock = `${cell.label}:00`;
  if (cell.failed) return `${part} ${clock} failed`;
  if (cell.downloadMbps === null) return `${part} ${clock} no reading`;
  const down = cell.downloadMbps.toFixed(1);
  const up = (cell.uploadMbps ?? 0).toFixed(1);
  const ping = (cell.pingMs ?? 0).toFixed(1);
  return `${part} ${clock}  ${down} down  ${up} up  ${ping} ping`;
}

export function tapeIndexFromClientX(
  clientX: number,
  left: number,
  width: number,
  count: number,
): number {
  if (count <= 0 || width <= 0) return 0;
  const x = Math.min(Math.max(clientX - left, 0), width - 1);
  return Math.min(count - 1, Math.floor((x / width) * count));
}

export function landingSampleRuns(): {
  ok: SpeedTestRow;
  failed: SpeedTestRow;
} {
  const cells = landingTapeCells();
  const noon = cells[12]!;
  const evening = cells[18]!;
  return {
    ok: {
      id: 12,
      testedAt: new Date(noon.hourStart).toISOString(),
      downloadMbps: noon.downloadMbps,
      uploadMbps: noon.uploadMbps,
      pingMs: noon.pingMs,
      jitterMs: 2,
      packetLoss: 0,
      isp: "Home ISP",
      serverName: "Local server",
      serverLocation: "This city",
      error: null,
    },
    failed: {
      id: 18,
      testedAt: new Date(evening.hourStart).toISOString(),
      downloadMbps: null,
      uploadMbps: null,
      pingMs: null,
      jitterMs: null,
      packetLoss: null,
      isp: null,
      serverName: null,
      serverLocation: null,
      error: "Cannot open socket",
    },
  };
}
