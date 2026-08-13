import type { SpeedTestRow } from "@/lib/types";

export type TapeCell = {
  hourStart: number;
  label: string;
  downloadMbps: number | null;
  failed: boolean;
};

export type DayPart =
  | "late-night"
  | "morning"
  | "noon"
  | "evening"
  | "night";

export const DAY_PART_LABELS: Record<DayPart, string> = {
  "late-night": "Late night",
  morning: "Morning",
  noon: "Noon",
  evening: "Evening",
  night: "Night",
};

export function dayPartForHour(hour: number): DayPart {
  if (hour < 5) return "late-night";
  if (hour < 11) return "morning";
  if (hour < 15) return "noon";
  if (hour < 20) return "evening";
  return "night";
}

function startOfHour(date: Date): number {
  const copy = new Date(date);
  copy.setMinutes(0, 0, 0);
  return copy.getTime();
}

function padHour(hour: number): string {
  return String(hour).padStart(2, "0");
}

export function buildSpeedTape(
  rows: SpeedTestRow[],
  now: Date,
  hours = 24,
): TapeCell[] {
  const end = startOfHour(now);
  const cells: TapeCell[] = [];

  for (let i = hours - 1; i >= 0; i -= 1) {
    const hourStart = end - i * 60 * 60 * 1000;
    const hourEnd = hourStart + 60 * 60 * 1000;
    const inHour = rows.filter((row) => {
      const t = new Date(row.testedAt).getTime();
      return t >= hourStart && t < hourEnd;
    });

    const successful = [...inHour]
      .reverse()
      .find((row) => row.error === null && row.downloadMbps !== null);
    const failed = inHour.length > 0 && !successful;

    cells.push({
      hourStart,
      label: padHour(new Date(hourStart).getHours()),
      downloadMbps: successful?.downloadMbps ?? null,
      failed,
    });
  }

  return cells;
}
