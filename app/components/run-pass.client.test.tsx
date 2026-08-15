// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RunPass } from "@/app/components/run-pass";
import { termText } from "@/lib/terms";
import type { SpeedTestRow } from "@/lib/types";

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

const test: SpeedTestRow = {
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

describe("RunPass client behavior", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(<RunPass test={test} />);
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

  it("moves remarks to the inspected field", () => {
    const ping = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Ping"),
    );
    expect(ping).toBeTruthy();

    act(() => {
      ping?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    const remarks = container.querySelector('[aria-live="polite"]');
    expect(remarks?.textContent).toBe(termText("ping"));
    expect(ping?.getAttribute("aria-pressed")).toBe("true");
  });
});
