import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CLONE_COMMAND,
  COPY_FEEDBACK_MS,
  GITHUB_URL,
  WINDOWS_BUILD_TOOLS_NOTE,
  commandsFor,
  copyCommand,
  detectSetupOs,
  landingHourReadout,
  landingTapeCells,
} from "./landing.mjs";

const siteDir = dirname(fileURLToPath(import.meta.url));

describe("detectSetupOs", () => {
  it("returns windows when the user agent names Windows", () => {
    expect(
      detectSetupOs("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"),
    ).toBe("windows");
  });

  it("returns mac for other user agents", () => {
    expect(
      detectSetupOs("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"),
    ).toBe("mac");
  });
});

describe("commandsFor", () => {
  it("uses brew for the Mac CLI and npm for the rest", () => {
    const commands = commandsFor("mac");
    expect(commands.map((item) => item.command)).toEqual([
      "brew tap teamookla/speedtest && brew install speedtest",
      "npm install",
      "npm run install-agent",
      "npm run dev",
    ]);
    expect(commands.at(-1)?.note).toMatch(/reports/i);
  });

  it("uses winget for Windows and keeps the build-tools note", () => {
    const commands = commandsFor("windows");
    expect(commands[0]?.command).toBe(
      "winget install -e --id Ookla.Speedtest.CLI",
    );
    expect(WINDOWS_BUILD_TOOLS_NOTE).toMatch(/Build Tools/);
  });
});

describe("copy helpers", () => {
  it("copies the public clone command", () => {
    expect(CLONE_COMMAND).toBe(
      "git clone https://github.com/tusharv/speedtape.git",
    );
    expect(GITHUB_URL).toBe("https://github.com/tusharv/speedtape");
    expect(COPY_FEEDBACK_MS).toBe(1800);
  });

  it("returns copied when writeText resolves", async () => {
    const result = await copyCommand(async () => undefined, "npm install");
    expect(result).toBe("copied");
  });

  it("returns failed when clipboard is missing", async () => {
    const result = await copyCommand(undefined, "npm install");
    expect(result).toBe("failed");
  });
});

describe("sample tape", () => {
  it("returns 24 hourly cells with one failed evening hour", () => {
    const cells = landingTapeCells();
    expect(cells).toHaveLength(24);
    expect(landingHourReadout(cells[12]!)).toBe(
      "Noon 12:00  110.0 down  12.0 up  9.0 ping",
    );
    expect(landingHourReadout(cells[18]!)).toBe("Evening 18:00 failed");
  });
});

describe("pages markup", () => {
  it("uses relative assets, locked copy, and no dashboard CTA", () => {
    const html = readFileSync(join(siteDir, "index.html"), "utf8");
    expect(html).toContain('href="styles.css"');
    expect(html).toContain('src="tape.js"');
    expect(html).not.toMatch(/href="\/styles\.css"/);
    expect(html).not.toContain("\u2014");
    expect(html).not.toContain("\u2013");
    expect(html).toContain("Know your line.");
    expect(html).toContain("View on GitHub");
    expect(html).toContain("For developers");
    expect(html).not.toMatch(/Open dashboard/i);
    expect(html).toContain('class="mark"');
    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 32 32"');
  });

  it("does not stretch the hero to the full viewport", () => {
    const css = readFileSync(join(siteDir, "styles.css"), "utf8");
    expect(css).not.toMatch(/min-height:\s*calc\(100dvh/);
    expect(css).not.toMatch(/min-height:\s*100dvh/);
  });
});
