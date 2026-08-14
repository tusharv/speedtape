import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  LandingCommands,
  copyCommand,
  copyRequestIsCurrent,
} from "@/app/components/landing-commands";

describe("LandingCommands", () => {
  it("keeps the four setup commands readable before hydration", () => {
    const html = renderToStaticMarkup(<LandingCommands />);

    expect(html).toContain("Install CLI");
    expect(html).toContain("Install dependencies");
    expect(html).toContain("Install agent");
    expect(html).toContain("Start dashboard");
    expect(html).toContain("Copy command");
    expect(html).toContain('aria-live="polite"');
  });

  it("returns copied when the clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyCommand(writeText, "npm install")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("npm install");
  });

  it("returns failed when the clipboard write rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard denied"));

    await expect(copyCommand(writeText, "npm install")).resolves.toBe("failed");
  });

  it("keeps only the latest copy request current", () => {
    expect(copyRequestIsCurrent(1, 2)).toBe(false);
    expect(copyRequestIsCurrent(2, 2)).toBe(true);
  });
});
