import { describe, expect, it } from "vitest";
import {
  AGENT_COMMANDS,
  DOCS_HREF,
  DOCS_LABEL,
  DOCS_LEDE,
  DOCS_TITLE,
  GUIDE_SECTIONS,
  MAC_COMMANDS,
  PAGES_DOCS_HREF,
  WINDOWS_BUILD_TOOLS_NOTE,
  WINDOWS_COMMANDS,
  guideSection,
  guideText,
} from "@/lib/guide";

describe("guide", () => {
  it("names the public docs page and the three audiences", () => {
    expect(DOCS_HREF).toBe("/docs");
    expect(PAGES_DOCS_HREF).toBe("docs.html");
    expect(DOCS_LABEL).toBe("Docs");
    expect(DOCS_TITLE).toBe("How to run it.");
    expect(DOCS_LEDE).toMatch(/AI agent/);
    expect(GUIDE_SECTIONS.map((section) => section.id)).toEqual([
      "mac",
      "windows",
      "agents",
    ]);
    expect(guideSection("agents").title).toBe("AI agents");
  });

  it("keeps Mac, Windows, and agent commands copyable and accurate", () => {
    expect(MAC_COMMANDS.map((item) => item.command)).toEqual([
      "brew tap teamookla/speedtest && brew install speedtest",
      "npm install",
      "npm run install-agent",
      "npm run dev",
    ]);
    expect(WINDOWS_COMMANDS.map((item) => item.command)).toEqual([
      "winget install -e --id Ookla.Speedtest.CLI",
      "npm install",
      "npm run install-agent",
      "npm run dev",
    ]);
    expect(AGENT_COMMANDS.map((item) => item.command)).toEqual([
      "command -v speedtest && speedtest --version",
      "where.exe speedtest",
      "tail -n 80 ~/Library/Logs/speedtape.out.log ~/Library/Logs/speedtape.err.log",
      'Get-Content -Tail 80 "$env:APPDATA\\speedtape\\speedtape.out.log","$env:APPDATA\\speedtape\\speedtape.err.log"',
      "npm test",
      "npm run dev",
      "npm run speedtest",
      "npm run install-agent",
    ]);
    expect(WINDOWS_BUILD_TOOLS_NOTE).toMatch(/Build Tools/);
  });

  it("covers setup paths, collector behavior, and how coding agents should work", () => {
    const text = guideText();
    expect(text).toContain("Node.js 20+");
    expect(text).toContain("~/Library/LaunchAgents/com.speedtape.speedtest.<id>.plist");
    expect(guideSection("agents").title).toBe("AI agents");
    expect(text).toContain("What the tool is");
    expect(text).toContain("Before you edit");
    expect(text).toContain("Check Speedtest CLI");
    expect(text).toContain("Read logs without the dashboard");
    expect(text).toContain("command -v speedtest");
    expect(text).toContain("speedtest --version");
    expect(text).toContain("where.exe speedtest");
    expect(text).toContain("speedtape.out.log");
    expect(text).toContain("speedtape.err.log");
    expect(text).toContain("SELECT tested_at, download_mbps, error FROM speed_tests");
    expect(text).toContain("Ookla");
    expect(text).toContain("%APPDATA%\\speedtape\\");
    expect(text).toContain("Speedtape.speedtest.<id>");
    expect(text).toContain("This computer must be awake");
    expect(text).toContain("SPEEDTAPE_DB");
    expect(text).toContain("docs/");
    expect(text).toContain("app/page.tsx");
    expect(text).toContain("AGENTS.md");
    expect(text).toContain("node_modules/next/dist/docs/");
    expect(text).not.toContain("Coding agents");
    expect(text).not.toContain("\u2014");
    expect(text).not.toContain("\u2013");
  });
});
