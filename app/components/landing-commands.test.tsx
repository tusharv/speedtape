import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  COPY_FEEDBACK_MS,
  LandingCommands,
  copyCommand,
  copyFeedbackReducer,
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
    expect(html).toMatch(/<span[^>]*aria-live="polite"[^>]*><\/span>/);
  });

  it("uses an 1800ms feedback duration", () => {
    expect(COPY_FEEDBACK_MS).toBe(1800);
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
