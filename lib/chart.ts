import type { SpeedTestRow } from "@/lib/types";

export const CHART_MAX_POINTS = 96;
export const NEIGHBOR_RUN_LIMIT = 5;

export type ChartPoint = {
  time: string;
  download: number | null;
  upload: number | null;
  ping: number | null;
};

function hasReading(point: ChartPoint): boolean {
  return point.download !== null || point.upload !== null || point.ping !== null;
}

export function downsampleChart(
  points: ChartPoint[],
  max = CHART_MAX_POINTS,
): ChartPoint[] {
  const readings = points.filter(hasReading);
  if (readings.length <= max) return readings;
  const start = new Date(readings[0]!.time).getTime();
  const end = new Date(readings[readings.length - 1]!.time).getTime();
  const span = Math.max(end - start, 1);
  const buckets: Array<ChartPoint | undefined> = Array.from({ length: max });
  for (const point of readings) {
    const t = new Date(point.time).getTime();
    const index = Math.min(max - 1, Math.floor(((t - start) / span) * max));
    buckets[index] = point;
  }
  return buckets.filter((point): point is ChartPoint => point !== undefined);
}

export function neighborRuns(
  previousNewestFirst: SpeedTestRow[],
  current: SpeedTestRow,
  nextOldestFirst: SpeedTestRow[],
  limit = NEIGHBOR_RUN_LIMIT,
): SpeedTestRow[] {
  return [
    ...previousNewestFirst.slice(0, limit).reverse(),
    current,
    ...nextOldestFirst.slice(0, limit),
  ];
}

export function runsToChartPoints(rows: SpeedTestRow[]): ChartPoint[] {
  return rows.map((row) => ({
    time: row.testedAt,
    download: row.downloadMbps,
    upload: row.uploadMbps,
    ping: row.pingMs,
  }));
}
