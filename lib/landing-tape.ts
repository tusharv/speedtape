import type { TapeCell } from "@/lib/tape";

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
