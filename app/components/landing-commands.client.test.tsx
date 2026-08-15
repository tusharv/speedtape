// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingCommands } from "@/app/components/landing-commands";

const MAC_INSTALL_CLI =
  "brew tap teamookla/speedtest && brew install speedtest";
const WINDOWS_INSTALL_CLI = "winget install -e --id Ookla.Speedtest.CLI";
const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function setClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

describe("LandingCommands client behavior", () => {
  let container: HTMLDivElement;
  let root: Root | null;
  let clipboardDescriptor: PropertyDescriptor | undefined;

  function buttonNamed(name: string) {
    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.includes(name),
    );

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error(`Button not found: ${name}`);
    }

    return button;
  }

  function liveRegion(button: HTMLButtonElement) {
    const region = button.querySelector('[aria-live="polite"]');

    if (!(region instanceof HTMLElement)) {
      throw new Error("Polite live region not found");
    }

    return region;
  }

  beforeEach(() => {
    reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    clipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root?.render(<LandingCommands />);
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container.remove();

    if (clipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }

    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    reactActGlobal.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("copies the Install CLI command and resets success after 1800ms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    const button = buttonNamed("Install CLI");
    const region = liveRegion(button);

    await act(async () => {
      button.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith(MAC_INSTALL_CLI);
    expect(region.textContent).toBe("Copied");

    act(() => {
      vi.advanceTimersByTime(1799);
    });
    expect(region.textContent).toBe("Copied");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(region.textContent).toBe("");
  });

  it("shows textual failure feedback when clipboard writing rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));
    setClipboard(writeText);
    const button = buttonNamed("Install dependencies");

    await act(async () => {
      button.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("npm install");
    expect(liveRegion(button).textContent).toBe("Copy failed");
  });

  it("shows textual failure feedback when the Clipboard API is missing", async () => {
    setClipboard();
    const button = buttonNamed("Install agent");

    await act(async () => {
      button.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(liveRegion(button).textContent).toBe("Copy failed");
  });

  it("keeps feedback scoped to the latest out-of-order copy", async () => {
    const first = deferred();
    const second = deferred();
    const writeText = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    setClipboard(writeText);
    const firstButton = buttonNamed("Install CLI");
    const secondButton = buttonNamed("Start dashboard");

    act(() => {
      firstButton.click();
    });
    act(() => {
      secondButton.click();
    });

    expect(liveRegion(firstButton).textContent).toBe("");
    expect(liveRegion(secondButton).textContent).toBe("");

    await act(async () => {
      first.resolve();
      await first.promise;
      await Promise.resolve();
    });
    expect(liveRegion(firstButton).textContent).toBe("");
    expect(liveRegion(secondButton).textContent).toBe("");
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      second.resolve();
      await second.promise;
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenNthCalledWith(1, MAC_INSTALL_CLI);
    expect(writeText).toHaveBeenNthCalledWith(2, "npm run dev");
    expect(liveRegion(firstButton).textContent).toBe("");
    expect(liveRegion(secondButton).textContent).toBe("Copied");
    expect(vi.getTimerCount()).toBe(1);
  });

  it("does not schedule feedback reset after unmounting a pending copy", async () => {
    const pending = deferred();
    const writeText = vi.fn().mockImplementation(() => pending.promise);
    setClipboard(writeText);
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    act(() => {
      buttonNamed("Install CLI").click();
    });
    act(() => {
      root?.unmount();
    });
    root = null;

    await act(async () => {
      pending.resolve();
      await pending.promise;
      await Promise.resolve();
    });

    expect(setTimeoutSpy).not.toHaveBeenCalledWith(
      expect.any(Function),
      1800,
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("copies the Windows CLI command after selecting Windows", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    const windowsTab = Array.from(
      container.querySelectorAll('[role="tab"]'),
    ).find((candidate) => candidate.textContent === "Windows");
    if (!(windowsTab instanceof HTMLButtonElement)) {
      throw new Error("Windows tab not found");
    }

    act(() => {
      windowsTab.click();
    });

    const button = buttonNamed("Install CLI");
    await act(async () => {
      button.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith(WINDOWS_INSTALL_CLI);
  });
});
