// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TermTip } from "@/app/components/term-tip";
import { termText } from "@/lib/terms";

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

describe("TermTip client behavior", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container.remove();
  });

  it("renders the explanation on the body so overflow parents cannot crop it", () => {
    act(() => {
      root?.render(
        <div
          className="overflow-x-clip"
          style={{ overflow: "hidden", width: 64, height: 24 }}
        >
          <TermTip term="ping">Ping</TermTip>
        </div>,
      );
    });

    const trigger = container.querySelector("abbr");
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.dispatchEvent(
        new MouseEvent("mouseenter", { bubbles: true, cancelable: true }),
      );
    });

    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip).toBeTruthy();
    expect(tooltip?.parentElement).toBe(document.body);
    expect(tooltip?.textContent).toBe(termText("ping"));
    expect(tooltip instanceof HTMLElement ? tooltip.style.position : "").toBe(
      "fixed",
    );
    expect(container.contains(tooltip)).toBe(false);
  });
});
