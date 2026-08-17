// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CLONE_COMMAND } from "./landing.mjs";
import { initLandingPage } from "./tape.js";

function setClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

describe("Copy clone button", () => {
  let clipboardDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    document.body.innerHTML = `
      <button type="button" data-copy="clone">
        Copy clone
        <span class="copy-status" aria-live="polite"></span>
      </button>
    `;
  });

  afterEach(() => {
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    document.body.innerHTML = "";
  });

  it("copies the git clone command and shows Copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    initLandingPage();

    const button = document.querySelector('[data-copy="clone"]');
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("Copy clone button missing");
    }

    button.click();
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(CLONE_COMMAND);
      expect(button.textContent).toContain("Copied");
    });
    expect(CLONE_COMMAND).toBe(
      "git clone https://github.com/tusharv/speedtape.git",
    );
  });
});

describe("Pinned guide commands", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("fills Mac, Windows, and agent lists from data-commands", () => {
    document.body.innerHTML = `
      <ul data-commands="mac"></ul>
      <ul data-commands="windows"></ul>
      <ul data-commands="agents"></ul>
    `;
    initLandingPage();

    const [mac, windows, agents] = document.querySelectorAll("[data-commands]");
    expect(mac?.textContent).toContain("brew install speedtest");
    expect(windows?.textContent).toContain("Ookla.Speedtest.CLI");
    expect(agents?.textContent).toContain("command -v speedtest");
    expect(agents?.textContent).toContain("npm test");
    expect(agents?.textContent).toContain("npm run speedtest");
  });
});
