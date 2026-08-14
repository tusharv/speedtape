import { spawn } from "node:child_process";
import { formatSpeedtestError } from "@/lib/speedtest-error";
import type { SpeedTestRecord } from "@/lib/types";

export { formatSpeedtestError } from "@/lib/speedtest-error";

export const SPEEDTEST_BIN = "speedtest";
export const SPEEDTEST_ARGS = [
  "--format=json",
  "--accept-license",
  "--accept-gdpr",
  "--progress=no",
] as const;

const BYTES_PER_SEC_TO_MBPS = 125_000;

export type SpawnResult = {
  code: number;
  stdout: string;
  stderr: string;
};

export type SpawnFn = (
  command: string,
  args: readonly string[],
) => Promise<SpawnResult>;

type OoklaPing = { jitter?: number; latency?: number };
type OoklaTransfer = { bandwidth?: number };
type OoklaServer = { name?: string; location?: string };

type OoklaResult = {
  timestamp?: string;
  ping?: OoklaPing;
  download?: OoklaTransfer;
  upload?: OoklaTransfer;
  packetLoss?: number | null;
  isp?: string;
  server?: OoklaServer;
};

export function bandwidthToMbps(bytesPerSecond: number): number {
  return bytesPerSecond / BYTES_PER_SEC_TO_MBPS;
}

function asNull(value: number | string | undefined | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asText(value: string | undefined | null): string | null {
  return value && value.length > 0 ? value : null;
}

export function parseSpeedtestJson(raw: string): SpeedTestRecord {
  const data = JSON.parse(raw) as OoklaResult;
  const download = data.download?.bandwidth;
  const upload = data.upload?.bandwidth;

  return {
    testedAt: data.timestamp ?? new Date().toISOString(),
    downloadMbps:
      typeof download === "number" ? bandwidthToMbps(download) : null,
    uploadMbps: typeof upload === "number" ? bandwidthToMbps(upload) : null,
    pingMs: asNull(data.ping?.latency),
    jitterMs: asNull(data.ping?.jitter),
    packetLoss: asNull(data.packetLoss),
    isp: asText(data.isp),
    serverName: asText(data.server?.name),
    serverLocation: asText(data.server?.location),
    error: null,
  };
}

export function errorRecord(
  message: string,
  testedAt: string,
): SpeedTestRecord {
  return {
    testedAt,
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    packetLoss: null,
    isp: null,
    serverName: null,
    serverLocation: null,
    error: formatSpeedtestError(message),
  };
}

export async function defaultSpawn(
  command: string,
  args: readonly string[],
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export async function collectSpeedtest(options?: {
  spawn?: SpawnFn;
  now?: () => Date;
}): Promise<SpeedTestRecord> {
  const spawnFn = options?.spawn ?? defaultSpawn;
  const now = options?.now ?? (() => new Date());
  const testedAt = now().toISOString();

  try {
    const result = await spawnFn(SPEEDTEST_BIN, SPEEDTEST_ARGS);
    if (result.code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`;
      return errorRecord(detail, testedAt);
    }
    return parseSpeedtestJson(result.stdout);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return errorRecord("speedtest CLI was not found", testedAt);
    }
    const message = err instanceof Error ? err.message : String(err);
    return errorRecord(message, testedAt);
  }
}
