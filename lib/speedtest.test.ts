import { describe, expect, it } from "vitest";
import {
  bandwidthToMbps,
  collectSpeedtest,
  formatSpeedtestError,
  parseSpeedtestJson,
} from "@/lib/speedtest";

const fixture = {
  type: "result",
  timestamp: "2022-03-16T01:40:00Z",
  ping: { jitter: 1.23, latency: 11.285 },
  download: { bandwidth: 804925, bytes: 5394240, elapsed: 6706 },
  upload: { bandwidth: 97467, bytes: 1321920, elapsed: 15005 },
  packetLoss: 0,
  isp: "Comcast Cable",
  server: {
    id: 1774,
    name: "Comcast",
    location: "Chicago, IL",
    country: "US",
  },
};

describe("bandwidthToMbps", () => {
  it("converts Ookla bytes-per-second to megabits per second", () => {
    expect(bandwidthToMbps(125_000)).toBe(1);
    expect(bandwidthToMbps(804925)).toBeCloseTo(6.4394, 4);
  });
});

describe("parseSpeedtestJson", () => {
  it("maps Ookla JSON fields into a stored speed record", () => {
    const result = parseSpeedtestJson(JSON.stringify(fixture));

    expect(result.testedAt).toBe("2022-03-16T01:40:00Z");
    expect(result.downloadMbps).toBeCloseTo(6.4394, 4);
    expect(result.uploadMbps).toBeCloseTo(0.779736, 4);
    expect(result.pingMs).toBe(11.285);
    expect(result.jitterMs).toBe(1.23);
    expect(result.packetLoss).toBe(0);
    expect(result.isp).toBe("Comcast Cable");
    expect(result.serverName).toBe("Comcast");
    expect(result.serverLocation).toBe("Chicago, IL");
    expect(result.error).toBeNull();
  });

  it("treats missing packet loss and jitter as null", () => {
    const result = parseSpeedtestJson(
      JSON.stringify({
        timestamp: "2022-03-16T01:40:00Z",
        ping: { latency: 8 },
        download: { bandwidth: 125000 },
        upload: { bandwidth: 125000 },
      }),
    );

    expect(result.jitterMs).toBeNull();
    expect(result.packetLoss).toBeNull();
    expect(result.isp).toBeNull();
    expect(result.serverName).toBeNull();
    expect(result.serverLocation).toBeNull();
  });
});

describe("formatSpeedtestError", () => {
  it("unwraps Ookla JSON error payloads", () => {
    expect(formatSpeedtestError('{"error":"Cannot open socket"}')).toBe(
      "Cannot open socket",
    );
    expect(formatSpeedtestError('  {"error":"Timeout exceeded"}\n')).toBe(
      "Timeout exceeded",
    );
  });

  it("keeps plain error text", () => {
    expect(formatSpeedtestError("speedtest CLI was not found")).toBe(
      "speedtest CLI was not found",
    );
  });
});

describe("collectSpeedtest", () => {
  it("returns a parsed record when the CLI exits 0", async () => {
    const record = await collectSpeedtest({
      spawn: async () => ({
        code: 0,
        stdout: JSON.stringify(fixture),
        stderr: "",
      }),
    });

    expect(record.error).toBeNull();
    expect(record.downloadMbps).toBeCloseTo(6.4394, 4);
  });

  it("stores an error record when the CLI is missing", async () => {
    const record = await collectSpeedtest({
      spawn: async () => {
        const err = new Error("spawn speedtest ENOENT") as NodeJS.ErrnoException;
        err.code = "ENOENT";
        throw err;
      },
      now: () => new Date("2026-08-13T07:00:00.000Z"),
    });

    expect(record.error).toMatch(/speedtest CLI was not found/i);
    expect(record.testedAt).toBe("2026-08-13T07:00:00.000Z");
    expect(record.downloadMbps).toBeNull();
    expect(record.uploadMbps).toBeNull();
    expect(record.pingMs).toBeNull();
  });

  it("stores an error record when the CLI exits non-zero", async () => {
    const record = await collectSpeedtest({
      spawn: async () => ({
        code: 1,
        stdout: "",
        stderr: "Failed to find a valid server",
      }),
      now: () => new Date("2026-08-13T07:00:00.000Z"),
    });

    expect(record.error).toContain("Failed to find a valid server");
    expect(record.downloadMbps).toBeNull();
  });

  it("unwraps JSON error payloads from the CLI", async () => {
    const record = await collectSpeedtest({
      spawn: async () => ({
        code: 1,
        stdout: "",
        stderr: '{"error":"Cannot open socket"}',
      }),
      now: () => new Date("2026-08-13T07:00:00.000Z"),
    });

    expect(record.error).toBe("Cannot open socket");
  });
});
