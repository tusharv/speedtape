export const CHART_MAX_POINTS = 96;

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
