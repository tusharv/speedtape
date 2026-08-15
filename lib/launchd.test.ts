import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generatePlist, writeAgentPlist } from "@/lib/launchd";

const paths = {
  agentBinPath:
    "/Users/tushar/Library/Application Support/speedtape/Speedtape.app/Contents/MacOS/Speedtape",
  workdir: "/Users/tushar/proj",
  pathEnv: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
  outLog: "/Users/tushar/Library/Logs/speedtape.out.log",
  errLog: "/Users/tushar/Library/Logs/speedtape.err.log",
};

describe("generatePlist", () => {
  it("writes an interval LaunchAgent with the schedule label and seconds", () => {
    const xml = generatePlist(paths, {
      label: "com.speedtape.speedtest.3",
      schedule: { kind: "interval", seconds: 900 },
    });

    expect(xml).toContain("<string>com.speedtape.speedtest.3</string>");
    expect(xml).not.toContain("<string>com.speedtape.speedtest</string>");
    expect(xml).toContain("<key>StartInterval</key>");
    expect(xml).toContain("<integer>900</integer>");
    expect(xml).toContain("<key>RunAtLoad</key>");
    expect(xml).toContain("<true/>");
    expect(xml).not.toContain("StartCalendarInterval");
    expect(xml).toContain(
      "<string>/Users/tushar/Library/Application Support/speedtape/Speedtape.app/Contents/MacOS/Speedtape</string>",
    );
    expect(xml).not.toContain("<string>/opt/homebrew/bin/node</string>");
    expect(xml).toContain("<key>AssociatedBundleIdentifiers</key>");
    expect(xml).toContain("<string>com.speedtape.collector</string>");
    expect(xml).toContain("/Users/tushar/Library/Logs/speedtape.out.log");
  });

  it("writes clock times every day without Weekday and without RunAtLoad", () => {
    const xml = generatePlist(paths, {
      label: "com.speedtape.speedtest.4",
      schedule: {
        kind: "clock",
        entries: [
          { hour: 8, minute: 0 },
          { hour: 21, minute: 0 },
        ],
      },
    });

    expect(xml).toContain("<key>StartCalendarInterval</key>");
    expect(xml).not.toContain("StartInterval");
    expect(xml).toContain("<false/>");
    expect(xml).not.toContain("<key>Weekday</key>");
    expect(xml).toMatch(
      /<key>Hour<\/key>\s*<integer>8<\/integer>\s*<key>Minute<\/key>\s*<integer>0<\/integer>/,
    );
    expect(xml).toMatch(
      /<key>Hour<\/key>\s*<integer>21<\/integer>\s*<key>Minute<\/key>\s*<integer>0<\/integer>/,
    );
    const hour8 = xml.indexOf("<integer>8</integer>");
    const hour21 = xml.indexOf("<integer>21</integer>");
    expect(hour8).toBeGreaterThan(-1);
    expect(hour21).toBeGreaterThan(hour8);
  });

  it("expands weekday subsets into one dict per weekday and time", () => {
    const xml = generatePlist(paths, {
      label: "com.speedtape.speedtest.5",
      schedule: {
        kind: "clock",
        entries: [
          { weekday: 1, hour: 18, minute: 0 },
          { weekday: 3, hour: 18, minute: 0 },
        ],
      },
    });

    expect(xml.match(/<key>Weekday<\/key>/g)?.length).toBe(2);
    expect(xml).toContain("<integer>1</integer>");
    expect(xml).toContain("<integer>3</integer>");
    expect(xml).toContain("<integer>18</integer>");
  });
});

describe("writeAgentPlist", () => {
  it("writes the plist under LaunchAgents using the schedule id", () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "hnc-home-"));
    const plistPath = writeAgentPlist({
      homeDir,
      projectRoot: "/Users/tushar/proj",
      nodePath: "/opt/homebrew/bin/node",
      tsxPath: "/Users/tushar/proj/node_modules/tsx/dist/cli.mjs",
      pathEnv: "/opt/homebrew/bin:/usr/bin",
      id: 7,
      schedule: { kind: "interval", seconds: 3600 },
    });

    expect(plistPath).toBe(
      path.join(
        homeDir,
        "Library",
        "LaunchAgents",
        "com.speedtape.speedtest.7.plist",
      ),
    );
    expect(fs.readFileSync(plistPath, "utf8")).toContain(
      "<string>com.speedtape.speedtest.7</string>",
    );
    expect(fs.readFileSync(plistPath, "utf8")).toContain(
      "<integer>3600</integer>",
    );
    expect(fs.readFileSync(plistPath, "utf8")).toContain(
      "<string>com.speedtape.collector</string>",
    );
    expect(
      fs.existsSync(
        path.join(
          homeDir,
          "Library",
          "Application Support",
          "speedtape",
          "Speedtape.app",
          "Contents",
          "Info.plist",
        ),
      ),
    ).toBe(true);
    fs.rmSync(homeDir, { recursive: true, force: true });
  });
});
