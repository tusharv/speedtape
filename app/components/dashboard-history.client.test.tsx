// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardHistory } from "@/app/components/dashboard-history";
import { loadDashboardRange } from "@/app/actions";
import type { Summary } from "@/lib/db";
import type { SpeedTestRow } from "@/lib/types";

vi.mock("@/app/actions", () => ({
  loadDashboardRange: vi.fn(),
}));

vi.mock("@/app/components/speed-chart", () => ({
  SpeedChart: ({ range }: { range: string }) => <div>{`chart ${range}`}</div>,
}));

vi.mock("@/app/components/run-test-button", () => ({
  RunTestButton: () => <button type="button">Run test now</button>,
}));

vi.mock("@/app/components/history-runs", () => ({
  HistoryRuns: ({ range }: { range: string }) => <div>{`runs ${range}`}</div>,
}));

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

const summary24h: Summary = {
  count: 2,
  download: { min: 10, avg: 20, max: 30 },
  upload: { min: 1, avg: 2, max: 3 },
  ping: { min: 8, avg: 9, max: 10 },
};

const summaryAll: Summary = {
  count: 8,
  download: { min: 4, avg: 40, max: 90 },
  upload: { min: 1, avg: 5, max: 9 },
  ping: { min: 7, avg: 12, max: 20 },
};

const preview: SpeedTestRow[] = [
  {
    id: 1,
    testedAt: "2026-08-13T12:00:00.000Z",
    downloadMbps: 20,
    uploadMbps: 2,
    pingMs: 9,
    jitterMs: 1,
    packetLoss: 0,
    isp: "Spectrum",
    serverName: "Ashburn",
    serverLocation: "Ashburn, VA",
    error: null,
  },
];

describe("DashboardHistory", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  function chip(name: string) {
    const node = Array.from(container.querySelectorAll("button, a")).find(
      (candidate) => candidate.textContent?.includes(name),
    );
    if (!(node instanceof HTMLElement)) {
      throw new Error(`Range chip not found: ${name}`);
    }
    return node;
  }

  beforeEach(() => {
    reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState(null, "", "/app");
    vi.mocked(loadDashboardRange).mockReset();
    vi.mocked(loadDashboardRange).mockResolvedValue({
      range: "all",
      summary: summaryAll,
      chart: [],
      preview,
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        <DashboardHistory
          initialRange="24h"
          initialSummary={summary24h}
          initialChart={[]}
          initialPreview={preview}
          isp="Spectrum"
          serverName="Ashburn"
        />,
      );
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container.remove();
  });

  it("changes range in place without following a range link", async () => {
    expect(container.textContent).toContain("10.0 / 20.0 / 30.0");
    expect(chip("All").tagName).toBe("BUTTON");

    await act(async () => {
      chip("All").click();
    });

    expect(loadDashboardRange).toHaveBeenCalledWith("all");
    expect(`${window.location.pathname}${window.location.search}`).toBe(
      "/app?range=all",
    );
    expect(container.textContent).toContain("4.0 / 40.0 / 90.0");
    expect(container.textContent).toContain("chart all");
    expect(container.textContent).toContain("runs all");
  });
});
