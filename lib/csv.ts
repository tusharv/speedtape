import type { Range, SpeedTestRow } from "@/lib/types";

export const CSV_HEADER =
  "id,tested_at,download_mbps,upload_mbps,ping_ms,jitter_ms,packet_loss,isp,server_name,server_location,status,error";

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function speedTestsToCsv(rows: SpeedTestRow[]): string {
  const lines = rows.map((row) =>
    [
      csvCell(row.id),
      csvCell(row.testedAt),
      csvCell(row.downloadMbps),
      csvCell(row.uploadMbps),
      csvCell(row.pingMs),
      csvCell(row.jitterMs),
      csvCell(row.packetLoss),
      csvCell(row.isp),
      csvCell(row.serverName),
      csvCell(row.serverLocation),
      csvCell(row.error === null ? "ok" : "failed"),
      csvCell(row.error),
    ].join(","),
  );
  return `${[CSV_HEADER, ...lines].join("\r\n")}\r\n`;
}

export function csvFilename(
  now = new Date(),
  query: { range: Range; from: string | null; to: string | null } = {
    range: "all",
    from: null,
    to: null,
  },
): string {
  if (query.from && query.to) {
    return `speedtape-runs-${query.from}-to-${query.to}.csv`;
  }
  if (query.from) return `speedtape-runs-from-${query.from}.csv`;
  if (query.to) return `speedtape-runs-to-${query.to}.csv`;
  const day = now.toISOString().slice(0, 10);
  return query.range === "all"
    ? `speedtape-runs-${day}.csv`
    : `speedtape-runs-${query.range}-${day}.csv`;
}
