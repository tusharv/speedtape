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

describe("paths", () => {
  it("puts Speedtape under Application Support and keeps the old folder name", () => {
    expect(APP_DIR).toBe("speedtape");
    expect(LEGACY_APP_DIR).toBe("home-network-checker");
    expect(defaultDbPath(home)).toBe(
      "/Users/tushar/Library/Application Support/speedtape/speedtests.db",
    );
    expect(legacyDbPath(home)).toBe(
      "/Users/tushar/Library/Application Support/home-network-checker/speedtests.db",
    );
  });

  it("names launchd logs and plists", () => {
    expect(agentLogPaths(home)).toEqual({
      outLog: "/Users/tushar/Library/Logs/speedtape.out.log",
      errLog: "/Users/tushar/Library/Logs/speedtape.err.log",
    });
    expect(agentPlistPath(home)).toBe(
      path.join(home, "Library", "LaunchAgents", "com.speedtape.speedtest.plist"),
    );
    expect(legacyAgentPlistPath(home)).toBe(
      path.join(
        home,
        "Library",
        "LaunchAgents",
        "com.home-network-checker.speedtest.plist",
      ),
    );
  });

  it("names a labeled schedule plist and the speedtest lock next to the db", () => {
    expect(scheduleLabel(3)).toBe("com.speedtape.speedtest.3");
    expect(labeledAgentPlistPath(home, 3)).toBe(
      path.join(home, "Library", "LaunchAgents", "com.speedtape.speedtest.3.plist"),
    );
    expect(speedtestLockPath(defaultDbPath(home))).toBe(
      path.join(home, "Library", "Application Support", "speedtape", "speedtest.lock"),
    );
    expect(speedtestLockPath("/tmp/custom.db")).toBe("/tmp/speedtest.lock");
  });
});
