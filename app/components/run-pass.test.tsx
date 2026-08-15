import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RunPass } from "@/app/components/run-pass";
import { termText } from "@/lib/terms";
import type { SpeedTestRow } from "@/lib/types";

function okRun(): SpeedTestRow {
  return {
    id: 42,
    testedAt: "2026-08-13T18:30:27.045Z",
    downloadMbps: 247.2,
    uploadMbps: 18.4,
    pingMs: 12.1,
    jitterMs: 1.2,
    packetLoss: 0.4,
    isp: "Spectrum",
    serverName: "Ashburn",
    serverLocation: "Ashburn, VA",
    error: null,
  };
}

function failedRun(error: string): SpeedTestRow {
  return {
    ...okRun(),
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

describe("RunPass", () => {
  it("reads as an issued line pass with origin, destination, and stub", () => {
    const html = renderToStaticMarkup(<RunPass test={okRun()} />);

    expect(html).toContain("Line pass");
    expect(html).toContain("From");
    expect(html).toContain("To");
    expect(html).toContain("Spectrum");
    expect(html).toContain("this house");
    expect(html).toContain("Ashburn, VA");
    expect(html).toContain("Ashburn");
    expect(html).toContain("Cleared");
    expect(html).toContain("247.2");
    expect(html).toContain("18.4");
    expect(html).toContain("12.1");
    expect(html).toContain("1.2");
    expect(html).toContain("0.4%");
    expect(html).toContain("Print");
    expect(html).toContain("Valid for this sample only");
    expect(html).toContain("data-pass-route");
    expect(html).toContain("HOUSE LINE");
    expect(html).not.toContain("overflow-x-clip");
    expect(html).not.toContain("Flight");
    expect(html).not.toContain("Gate");
    expect(html).not.toContain("Seat");
  });

  it("keeps remarks on the pass so field help is never cropped", () => {
    const html = renderToStaticMarkup(<RunPass test={okRun()} />);

    expect(html).toContain("Remarks");
    expect(html).toContain(termText("download"));
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('type="button"');
  });

  it("marks a failed reading as void and shows a plain error", () => {
    const html = renderToStaticMarkup(
      <RunPass test={failedRun('{"error":"Cannot open socket"}')} />,
    );

    expect(html).toContain("Void");
    expect(html).toContain("Cannot open socket");
    expect(html).toContain(termText("failed"));
    expect(html).not.toContain("{&quot;error&quot;");
  });
});
