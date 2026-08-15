import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  APP_DIR,
  LEGACY_APP_DIR,
  defaultDbPath,
  legacyDbPath,
  agentLogPaths,
  agentPlistPath,
  labeledAgentPlistPath,
  scheduleLabel,
  speedtestLockPath,
  legacyAgentPlistPath,
} from "@/lib/paths";

const home = "/Users/tushar";
const darwin = { platform: "darwin" as const };
const windows = {
  platform: "win32" as const,
  appData: "C:\\Users\\tushar\\AppData\\Roaming",
};

describe("paths", () => {
  it("puts Speedtape under Application Support and keeps the old folder name", () => {
    expect(APP_DIR).toBe("speedtape");
    expect(LEGACY_APP_DIR).toBe("home-network-checker");
    expect(defaultDbPath(home, darwin)).toBe(
      "/Users/tushar/Library/Application Support/speedtape/speedtests.db",
    );
    expect(legacyDbPath(home, darwin)).toBe(
      "/Users/tushar/Library/Application Support/home-network-checker/speedtests.db",
    );
  });

  it("puts Speedtape under AppData Roaming on Windows", () => {
    expect(defaultDbPath("C:\\Users\\tushar", windows)).toBe(
      "C:\\Users\\tushar\\AppData\\Roaming\\speedtape\\speedtests.db",
    );
    expect(legacyDbPath("C:\\Users\\tushar", windows)).toBe(
      "C:\\Users\\tushar\\AppData\\Roaming\\home-network-checker\\speedtests.db",
    );
    expect(agentLogPaths("C:\\Users\\tushar", windows)).toEqual({
      outLog:
        "C:\\Users\\tushar\\AppData\\Roaming\\speedtape\\speedtape.out.log",
      errLog:
        "C:\\Users\\tushar\\AppData\\Roaming\\speedtape\\speedtape.err.log",
    });
  });

  it("names launchd logs and plists", () => {
    expect(agentLogPaths(home, darwin)).toEqual({
      outLog: "/Users/tushar/Library/Logs/speedtape.out.log",
      errLog: "/Users/tushar/Library/Logs/speedtape.err.log",
    });
    expect(agentPlistPath(home, darwin)).toBe(
      path.posix.join(
        home,
        "Library",
        "LaunchAgents",
        "com.speedtape.speedtest.plist",
      ),
    );
    expect(legacyAgentPlistPath(home, darwin)).toBe(
      path.posix.join(
        home,
        "Library",
        "LaunchAgents",
        "com.home-network-checker.speedtest.plist",
      ),
    );
  });

  it("names a labeled schedule plist and the speedtest lock next to the db", () => {
    expect(scheduleLabel(3)).toBe("com.speedtape.speedtest.3");
    expect(labeledAgentPlistPath(home, 3, darwin)).toBe(
      path.posix.join(
        home,
        "Library",
        "LaunchAgents",
        "com.speedtape.speedtest.3.plist",
      ),
    );
    expect(speedtestLockPath(defaultDbPath(home, darwin))).toBe(
      path.posix.join(
        home,
        "Library",
        "Application Support",
        "speedtape",
        "speedtest.lock",
      ),
    );
    expect(speedtestLockPath("/tmp/custom.db")).toBe("/tmp/speedtest.lock");
  });
});
