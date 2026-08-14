export type SpeedTestRecord = {
  testedAt: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  packetLoss: number | null;
  isp: string | null;
  serverName: string | null;
  serverLocation: string | null;
  error: string | null;
};

export type SpeedTestRow = SpeedTestRecord & { id: number };

export type Range = "24h" | "7d" | "30d" | "all";
