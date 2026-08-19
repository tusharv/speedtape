import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RunArchive } from "@/app/components/run-archive";
import type { SpeedTestRow } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
}));

function row(partial: Partial<SpeedTestRow> & { id: number }): SpeedTestRow {
  return {
    testedAt: "2026-08-13T12:00:00.000Z",
    downloadMbps: 80,
    uploadMbps: 20,
    pingMs: 10,
    jitterMs: 1,
    packetLoss: 0,
    isp: "Spectrum",
    serverName: "Server",
    serverLocation: "Here",
    error: null,
    ...partial,
  };
}

describe("RunArchive", () => {
  it("lets you pick a service provider and shows that provider's min / avg / max", () => {
    const html = renderToStaticMarkup(
      <RunArchive
        query={{
          range: "all",
          from: null,
          to: null,
          status: "all",
          slow: false,
          ping: false,
          sort: "newest",
          isp: "Spectrum",
        }}
        summary={{
          count: 2,
          download: { min: 40, avg: 80, max: 120 },
          upload: { min: 10, avg: 20, max: 30 },
          ping: { min: 8, avg: 14, max: 20 },
        }}
        providers={["Comcast Cable", "Spectrum"]}
        initialRows={[row({ id: 1, downloadMbps: 120 }), row({ id: 2, downloadMbps: 40 })]}
        total={2}
      />,
    );

    expect(html).toContain("Service provider");
    expect(html).toContain("Spectrum");
    expect(html).toContain("Comcast Cable");
    expect(html).toContain("40.0 / 80.0 / 120.0");
    expect(html).toContain("Min / avg / max");
  });
});
