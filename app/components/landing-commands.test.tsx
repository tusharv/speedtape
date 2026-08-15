import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  COPY_FEEDBACK_MS,
  LandingCommands,
  MAC_COMMANDS,
  WINDOWS_BUILD_TOOLS_NOTE,
  WINDOWS_COMMANDS,
  copyCommand,
  copyFeedbackReducer,
  createCopyRequestTracker,
  detectSetupOs,
  initialCopyFeedbackState,
} from "@/app/components/landing-commands";

describe("LandingCommands", () => {
  it("keeps the four setup commands readable before hydration", () => {
    const html = renderToStaticMarkup(<LandingCommands />);

    expect(html).toContain("Install CLI");
    expect(html).toContain("Install dependencies");
    expect(html).toContain("Install agent");
    expect(html).toContain("Start dashboard");
    expect(html).toContain("Copy command");
    expect(html).toContain('role="tablist"');
    expect(html).toContain("Mac");
    expect(html).toContain("Windows");
    expect(html).toContain("brew tap teamookla/speedtest");
    expect(html).toContain("brew install speedtest");
    expect(html).not.toContain(WINDOWS_COMMANDS[0].command);
    expect(html).toMatch(/<span[^>]*aria-live="polite"[^>]*><\/span>/);
  });

  it("detects Windows from the user agent and keeps Mac as the default", () => {
    expect(detectSetupOs("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      "windows",
    );
    expect(detectSetupOs("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)")).toBe(
      "mac",
    );
  });

  it("keeps a Windows CLI command and build-tools note", () => {
    expect(WINDOWS_COMMANDS[0].command).toBe(
      "winget install -e --id Ookla.Speedtest.CLI",
    );
    expect(WINDOWS_BUILD_TOOLS_NOTE.toLowerCase()).toContain(
      "visual studio c++ build tools",
    );
  });

  it("uses an 1800ms feedback duration", () => {
    expect(COPY_FEEDBACK_MS).toBe(1800);
  });

  it("invalidates pending copy requests", () => {
    const tracker = createCopyRequestTracker();
    const firstRequest = tracker.start();

    expect(tracker.isCurrent(firstRequest)).toBe(true);

    const secondRequest = tracker.start();
    expect(tracker.isCurrent(firstRequest)).toBe(false);
    expect(tracker.isCurrent(secondRequest)).toBe(true);

    tracker.invalidate();
    expect(tracker.isCurrent(secondRequest)).toBe(false);
  });

  it("clears prior feedback when a new copy request starts", () => {
    const settled = copyFeedbackReducer(
      copyFeedbackReducer(initialCopyFeedbackState, {
        type: "start",
        requestId: 1,
      }),
      {
        type: "settle",
        requestId: 1,
        name: "Install CLI",
        result: "copied",
      },
    );

    expect(
      copyFeedbackReducer(settled, { type: "start", requestId: 2 }),
    ).toEqual({ latestRequestId: 2 });
  });

  it("does not let a stale request overwrite the latest feedback", () => {
    const started = copyFeedbackReducer(initialCopyFeedbackState, {
      type: "start",
      requestId: 2,
    });

    expect(
      copyFeedbackReducer(started, {
        type: "settle",
        requestId: 1,
        name: "Install CLI",
        result: "copied",
      }),
    ).toBe(started);
  });

  it("sets copied and failed feedback for the latest request", () => {
    const started = copyFeedbackReducer(initialCopyFeedbackState, {
      type: "start",
      requestId: 1,
    });

    expect(
      copyFeedbackReducer(started, {
        type: "settle",
        requestId: 1,
        name: "Install CLI",
        result: "copied",
      }),
    ).toEqual({
      latestRequestId: 1,
      feedback: { name: "Install CLI", result: "copied" },
    });
    expect(
      copyFeedbackReducer(started, {
        type: "settle",
        requestId: 1,
        name: "Install CLI",
        result: "failed",
      }),
    ).toEqual({
      latestRequestId: 1,
      feedback: { name: "Install CLI", result: "failed" },
    });
  });

  it("ignores a stale reset and clears the latest feedback", () => {
    const settled = copyFeedbackReducer(
      copyFeedbackReducer(initialCopyFeedbackState, {
        type: "start",
        requestId: 2,
      }),
      {
        type: "settle",
        requestId: 2,
        name: "Install CLI",
        result: "copied",
      },
    );

    expect(copyFeedbackReducer(settled, { type: "reset", requestId: 1 })).toBe(
      settled,
    );
    expect(copyFeedbackReducer(settled, { type: "reset", requestId: 2 })).toEqual(
      { latestRequestId: 2 },
    );
  });

  it("returns copied when the clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyCommand(writeText, "npm install")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("npm install");
  });

  it("returns failed when the clipboard write rejects or is unavailable", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));

    await expect(copyCommand(writeText, "npm install")).resolves.toBe("failed");
    await expect(copyCommand(undefined, "npm install")).resolves.toBe("failed");
  });
});
