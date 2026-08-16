import { describe, expect, it } from "vitest";
import { csvFilename, speedTestsToCsv } from "@/lib/csv";
import type { SpeedTestRow } from "@/lib/types";

function row(partial: Partial<SpeedTestRow> & { id: number }): SpeedTestRow {
  return {
    testedAt: "2026-08-13T12:00:00.000Z",
    downloadMbps: 100,
    uploadMbps: 20,
    pingMs: 10,
    jitterMs: 1,
    packetLoss: 0,
    isp: "ISP",
    serverName: "Server",
    serverLocation: "Here",
    error: null,
    ...partial,
  };
}

describe("speedTestsToCsv", () => {
  it("writes a header and one successful row", () => {
    const csv = speedTestsToCsv([row({ id: 7 })]);
    const lines = csv.trimEnd().split("\r\n");

    expect(lines[0]).toBe(
      "id,tested_at,download_mbps,upload_mbps,ping_ms,jitter_ms,packet_loss,isp,server_name,server_location,status,error",
    );
    expect(lines[1]).toBe(
      "7,2026-08-13T12:00:00.000Z,100,20,10,1,0,ISP,Server,Here,ok,",
    );
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("quotes commas, quotes, and newlines, and marks failed rows", () => {
    const csv = speedTestsToCsv([
      row({
        id: 3,
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        jitterMs: null,
        packetLoss: null,
        isp: "City, Fiber",
        serverName: 'Say "hi"',
        serverLocation: "Line 1\nLine 2",
        error: '{"error":"Cannot open socket"}',
      }),
    ]);
    const body = csv.trimEnd().split("\r\n")[1];

    expect(body).toContain('"City, Fiber"');
    expect(body).toContain('"Say ""hi"""');
    expect(body).toContain('"Line 1\nLine 2"');
    expect(body).toContain(',failed,');
    expect(body).toContain('"{""error"":""Cannot open socket""}"');
  });

  it("writes only the header when there are no rows", () => {
    expect(speedTestsToCsv([])).toBe(
      "id,tested_at,download_mbps,upload_mbps,ping_ms,jitter_ms,packet_loss,isp,server_name,server_location,status,error\r\n",
    );
  });
});

describe("csvFilename", () => {
  it("uses the UTC date in the download name", () => {
    expect(csvFilename(new Date("2026-08-16T22:15:00.000Z"))).toBe(
      "speedtape-runs-2026-08-16.csv",
    );
  });

  it("includes the time window when the export is not all-time", () => {
    expect(
      csvFilename(new Date("2026-08-16T22:15:00.000Z"), {
        range: "7d",
        from: null,
        to: null,
      }),
    ).toBe("speedtape-runs-7d-2026-08-16.csv");
  });

  it("uses the picked days in the download name", () => {
    expect(
      csvFilename(new Date("2026-08-16T22:15:00.000Z"), {
        range: "all",
        from: "2026-08-01",
        to: "2026-08-10",
      }),
    ).toBe("speedtape-runs-2026-08-01-to-2026-08-10.csv");
  });
});
