import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RunCard } from "@/app/components/run-card";
import type { SpeedTestRow } from "@/lib/types";

function failed(error: string): SpeedTestRow {
  return {
    id: 14,
    testedAt: "2026-08-13T18:30:27.045Z",
    downloadMbps: null,
    uploadMbps: null,
    pingMs: null,
    jitterMs: null,
    packetLoss: null,
    isp: null,
    serverName: null,
    serverLocation: null,
    error,
  };
}

describe("RunCard", () => {
  it("shows a plain sentence instead of raw CLI JSON", () => {
    const html = renderToStaticMarkup(
      <RunCard test={failed('{"error":"Cannot open socket"}')} />,
    );

    expect(html).toContain("Cannot open socket");
    expect(html).not.toContain("{&quot;error&quot;");
    expect(html).not.toContain('{"error"');
  });

  it("keeps the same metric block as ok cards", () => {
    const html = renderToStaticMarkup(
      <RunCard test={failed("Cannot open socket")} />,
    );

    expect(html).toContain("Cannot open socket");
    expect(html).toContain("Down");
    expect(html).toContain("Up");
    expect(html).toContain("Ping");
    expect(html).toContain("h-full");
  });
});
