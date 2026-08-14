import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AGENT_LABEL } from "@/lib/agent";
import { generatePlist, writeAgentPlist } from "@/lib/launchd";

describe("generatePlist", () => {
  it("writes an hourly LaunchAgent with absolute paths", () => {
    const xml = generatePlist({
      nodePath: "/opt/homebrew/bin/node",
      tsxPath: "/Users/tushar/proj/node_modules/tsx/dist/cli.mjs",
      scriptPath: "/Users/tushar/proj/scripts/run-speedtest.ts",
      workdir: "/Users/tushar/proj",
      pathEnv: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
      outLog: "/Users/tushar/Library/Logs/speedtape.out.log",
      errLog: "/Users/tushar/Library/Logs/speedtape.err.log",
    });

    expect(xml).toContain(`<string>${AGENT_LABEL}</string>`);
    expect(xml).toContain("<string>com.speedtape.speedtest</string>");
    expect(xml).toContain("<key>StartInterval</key>");
    expect(xml).toContain("<integer>3600</integer>");
    expect(xml).toContain("<string>/opt/homebrew/bin/node</string>");
    expect(xml).toContain(
      "<string>/Users/tushar/proj/scripts/run-speedtest.ts</string>",
    );
    expect(xml).toContain("<key>WorkingDirectory</key>");
    expect(xml).toContain("<string>/Users/tushar/proj</string>");
    expect(xml).toContain("/opt/homebrew/bin");
    expect(xml).toContain("/Users/tushar/Library/Logs/speedtape.out.log");
  });

  it("writes the plist under LaunchAgents in the home directory", () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-home-"));
    const plistPath = writeAgentPlist({
      homeDir,
      projectRoot: "/Users/tushar/proj",
      nodePath: "/opt/homebrew/bin/node",
      tsxPath: "/Users/tushar/proj/node_modules/tsx/dist/cli.mjs",
      pathEnv: "/opt/homebrew/bin:/usr/bin",
    });

    expect(plistPath).toBe(
      path.join(homeDir, "Library", "LaunchAgents", `${AGENT_LABEL}.plist`),
    );
    expect(fs.readFileSync(plistPath, "utf8")).toContain(
      "<integer>3600</integer>",
    );
    expect(fs.readFileSync(plistPath, "utf8")).toContain(
      "speedtape.out.log",
    );
    fs.rmSync(homeDir, { recursive: true, force: true });
  });
});
