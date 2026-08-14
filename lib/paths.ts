import os from "node:os";
import path from "node:path";

export const APP_DIR = "speedtape";
export const LEGACY_APP_DIR = "home-network-checker";
export const DB_FILE = "speedtests.db";
export const AGENT_LABEL = "com.speedtape.speedtest";
export const LEGACY_AGENT_LABEL = "com.home-network-checker.speedtest";

export function defaultDbPath(homeDir = os.homedir()): string {
  return path.join(
    homeDir,
    "Library",
    "Application Support",
    APP_DIR,
    DB_FILE,
  );
}

export function legacyDbPath(homeDir = os.homedir()): string {
  return path.join(
    homeDir,
    "Library",
    "Application Support",
    LEGACY_APP_DIR,
    DB_FILE,
  );
}

export function agentLogPaths(homeDir = os.homedir()): {
  outLog: string;
  errLog: string;
} {
  return {
    outLog: path.join(homeDir, "Library", "Logs", "speedtape.out.log"),
    errLog: path.join(homeDir, "Library", "Logs", "speedtape.err.log"),
  };
}

export function agentPlistPath(homeDir = os.homedir()): string {
  return path.join(homeDir, "Library", "LaunchAgents", `${AGENT_LABEL}.plist`);
}

export function scheduleLabel(id: number): string {
  return `${AGENT_LABEL}.${id}`;
}

export function labeledAgentPlistPath(
  homeDir: string,
  id: number,
): string {
  return path.join(
    homeDir,
    "Library",
    "LaunchAgents",
    `${scheduleLabel(id)}.plist`,
  );
}

export function speedtestLockPath(dbPath: string): string {
  return path.join(path.dirname(dbPath), "speedtest.lock");
}

export function legacyAgentPlistPath(homeDir = os.homedir()): string {
  return path.join(
    homeDir,
    "Library",
    "LaunchAgents",
    `${LEGACY_AGENT_LABEL}.plist`,
  );
}
