import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  CLONE_COMMAND,
  COPY_FEEDBACK_MS,
  GITHUB_URL,
  OG_IMAGE_ALT,
  OG_IMAGE_URL,
  PAGES_URL,
  WINDOWS_BUILD_TOOLS_NOTE,
  commandsFor,
  copyCommand,
  detectSetupOs,
  guideCommands,
  landingHourReadout,
  landingTapeCells,
  summarizeTapeGroups,
  tapeBarHeightPct,
} from "./landing.mjs";
import { brandMarkPointsAttr, brandMarkPolygons } from "@/lib/brand-mark";

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

describe("guideCommands", () => {
  it("pins Mac, Windows, and agent command lists", () => {
    expect(guideCommands("mac")[0]?.command).toContain("brew install speedtest");
    expect(guideCommands("windows")[0]?.command).toContain("Ookla.Speedtest.CLI");
    expect(guideCommands("agents").map((item) => item.command)).toEqual([
      "command -v speedtest && speedtest --version",
      "where.exe speedtest",
      "tail -n 80 ~/Library/Logs/speedtape.out.log ~/Library/Logs/speedtape.err.log",
      'Get-Content -Tail 80 "$env:APPDATA\\speedtape\\speedtape.out.log","$env:APPDATA\\speedtape\\speedtape.err.log"',
      "npm test",
      "npm run dev",
      "npm run speedtest",
      "npm run install-agent",
    ]);
  });
});

describe("copy helpers", () => {
  it("copies the public clone command", () => {
    expect(CLONE_COMMAND).toBe(
      "git clone https://github.com/tusharv/speedtape.git",
    );
    expect(GITHUB_URL).toBe("https://github.com/tusharv/speedtape");
    expect(PAGES_URL).toBe("https://tusharv.github.io/speedtape");
    expect(OG_IMAGE_URL).toBe("https://tusharv.github.io/speedtape/og.png");
    expect(OG_IMAGE_ALT).toBe("Speedtape 24 hour sample tape");
    expect(COPY_FEEDBACK_MS).toBe(1800);
  });

  it("returns copied when writeText resolves", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const result = await copyCommand(writeText, CLONE_COMMAND);
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(
      "git clone https://github.com/tusharv/speedtape.git",
    );
  });

  it("returns failed when clipboard is missing", async () => {
    const result = await copyCommand(undefined, "npm install");
    expect(result).toBe("failed");
  });

  it("falls back to document copy when the Clipboard API is missing", async () => {
    const area = {
      value: "",
      style: {},
      setAttribute() {},
      select() {},
      remove: vi.fn(),
    };
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal("document", {
      createElement: () => area,
      body: {
        appendChild() {},
      },
      execCommand,
    });

    try {
      const result = await copyCommand(undefined, CLONE_COMMAND);
      expect(result).toBe("copied");
      expect(area.value).toBe(
        "git clone https://github.com/tusharv/speedtape.git",
      );
      expect(execCommand).toHaveBeenCalledWith("copy");
    } finally {
      vi.unstubAllGlobals();
    }
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
    expect(tapeBarHeightPct(cells[18]!, 110)).toBe(tapeBarHeightPct(cells[10]!, 0));
    expect(tapeBarHeightPct(cells[18]!, 110)).toBeLessThan(
      tapeBarHeightPct(cells[12]!, 110),
    );
  });

  it("groups sample hours by day part", () => {
    const groups = summarizeTapeGroups(landingTapeCells());
    expect(groups.map((group) => [group.part, group.count])).toEqual([
      ["Late night", 5],
      ["Morning", 6],
      ["Noon", 4],
      ["Evening", 5],
      ["Night", 4],
    ]);
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
    expect(html).toContain("Local network monitor");
    expect(html).toContain("View on GitHub");
    expect(html).toContain('href="docs.html"');
    expect(html).toContain(">Docs</a>");
    expect(html).toContain("How it runs");
    expect(html).toContain("Show your provider the record.");
    expect(html).toContain("Close the dashboard. This computer keeps testing.");
    expect(html).toContain("Every run stays in the record.");
    expect(html).toContain("run-card-void");
    expect(html).toContain('aria-label="Run 12, ok');
    expect(html).toContain('aria-label="Run 18, failed');
    expect(html).toContain("110.0");
    expect(html).toContain("Cannot open socket");
    expect(html).not.toMatch(/Open dashboard/i);
    expect(html).toContain('data-brand-mark="true"');
    expect(html).toContain('class="mark"');
    expect(html).toContain("<polygon");
    expect(html).not.toContain("data-brand-bars");
    for (const points of brandMarkPolygons().map(brandMarkPointsAttr)) {
      expect(html).toContain(`points="${points}"`);
    }
    const cloneStart = html.indexOf('data-copy="clone"');
    const cloneBlock = html.slice(
      cloneStart,
      html.indexOf("</button>", cloneStart),
    );
    expect(cloneBlock).toContain("Copy clone");
    expect(cloneBlock).toContain("aria-live");
    expect(cloneBlock).not.toContain("sr-live");
    expect(cloneBlock).not.toContain("sr-only");
    const hero = html.slice(
      html.indexOf('class="hero-copy"'),
      html.indexOf('class="printout"'),
    );
    expect(hero).toContain("btn-primary");
    expect(hero).toContain('data-copy="clone"');
    expect(hero).not.toContain("View on GitHub");
  });

  it("unfurls with an absolute open graph image", () => {
    const landing = readFileSync(join(siteDir, "index.html"), "utf8");
    const docs = readFileSync(join(siteDir, "docs.html"), "utf8");
    for (const html of [landing, docs]) {
      expect(html).toContain(`content="${OG_IMAGE_URL}"`);
      expect(html).toContain(`content="${OG_IMAGE_ALT}"`);
      expect(html).toContain('name="twitter:card"');
      expect(html).toContain("summary_large_image");
      expect(html).toContain(`content="${PAGES_URL}/"`);
    }
  });

  it("publishes a 1200 by 630 open graph png", () => {
    const png = readFileSync(join(siteDir, "og.png"));
    expect([...png.subarray(0, 8)]).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    const nextPng = readFileSync(join(siteDir, "..", "app", "opengraph-image.png"));
    expect(nextPng.equals(png)).toBe(true);
  });

  it("does not stretch the hero to the full viewport", () => {
    const css = readFileSync(join(siteDir, "styles.css"), "utf8");
    const hero = css.slice(css.indexOf(".hero {"), css.indexOf(".hero-copy {"));
    expect(hero).not.toMatch(/min-height:\s*calc\(100dvh/);
    expect(hero).not.toMatch(/min-height:\s*100dvh/);
  });

  it("shares the in-app landing tokens", () => {
    const css = readFileSync(join(siteDir, "styles.css"), "utf8");
    expect(css).toContain('font-family: Geist');
    expect(css).toContain("--copper: #0f766e");
    expect(css).toContain("--ink: #fafafa");
    expect(css).toContain("--radius: 8px");
  });

  it("does not reserve extra width on the clone button", () => {
    const css = readFileSync(join(siteDir, "styles.css"), "utf8");
    expect(css).not.toMatch(/\.copy-status\s*\{[^}]*min-width/);
    expect(css).toMatch(/\.copy-status:empty\s*\{\s*display:\s*none/);
  });

  it("uses the same site header on landing and docs", () => {
    const landing = readFileSync(join(siteDir, "index.html"), "utf8");
    const docs = readFileSync(join(siteDir, "docs.html"), "utf8");
    const header = /<header class="nav">[\s\S]*?<\/header>/;

    const landingHeader = landing.match(header)?.[0];
    const docsHeader = docs.match(header)?.[0];

    expect(landingHeader).toBeTruthy();
    expect(docsHeader).toBeTruthy();
    expect(landingHeader).toContain('href="./"');
    expect(landingHeader).toContain('href="docs.html"');
    expect(landingHeader).toContain("View on GitHub");
    expect(landingHeader).toContain('class="btn btn-ghost"');
    expect(docsHeader).toBe(landingHeader);
  });

  it("publishes a docs page for Mac, Windows, and agents", () => {
    const html = readFileSync(join(siteDir, "docs.html"), "utf8");
    expect(html).toContain("How to run it.");
    expect(html).toContain('href="styles.css"');
    expect(html).toContain('src="tape.js"');
    expect(html).toContain('id="mac"');
    expect(html).toContain('id="windows"');
    expect(html).toContain('id="agents"');
    expect(html).toContain('data-commands="mac"');
    expect(html).toContain('data-commands="windows"');
    expect(html).toContain('data-commands="agents"');
    expect(html).toContain("AI agents");
    expect(html).toContain("Check Speedtest CLI");
    expect(html).toContain("Read logs without the dashboard");
    expect(html).toContain("speedtape.out.log");
    expect(html).toContain("node_modules/next/dist/docs/");
    expect(html).toContain("SPEEDTAPE_DB");
    expect(html).not.toMatch(/Open dashboard/i);
    expect(html).not.toContain("\u2014");
    expect(html).not.toContain("\u2013");
  });
});
