import os from "node:os";
import path from "node:path";

export const APP_DIR = "speedtape";
export const LEGACY_APP_DIR = "home-network-checker";
export const DB_FILE = "speedtests.db";
export const AGENT_LABEL = "com.speedtape.speedtest";
export const LEGACY_AGENT_LABEL = "com.home-network-checker.speedtest";
export const COLLECTOR_BUNDLE_ID = "com.speedtape.collector";
export const COLLECTOR_APP_NAME = "Speedtape.app";

export type PathOptions = {
  platform?: NodeJS.Platform;
  appData?: string;
};

function resolvePlatform(options: PathOptions = {}): NodeJS.Platform {
  return options.platform ?? process.platform;
}

function joinPath(platform: NodeJS.Platform, parts: string[]): string {
  return (platform === "win32" ? path.win32 : path.posix).join(...parts);
}

function windowsAppData(homeDir: string, options: PathOptions): string {
  return (
    options.appData ??
    process.env.APPDATA ??
    joinPath("win32", [homeDir, "AppData", "Roaming"])
  );
}

export function defaultDbPath(
  homeDir = os.homedir(),
  options: PathOptions = {},
): string {
  const platform = resolvePlatform(options);
  if (platform === "win32") {
    return joinPath("win32", [windowsAppData(homeDir, options), APP_DIR, DB_FILE]);
  }
  return joinPath(platform, [
    homeDir,
    "Library",
    "Application Support",
    APP_DIR,
    DB_FILE,
  ]);
}

export function legacyDbPath(
  homeDir = os.homedir(),
  options: PathOptions = {},
): string {
  const platform = resolvePlatform(options);
  if (platform === "win32") {
    return joinPath("win32", [
      windowsAppData(homeDir, options),
      LEGACY_APP_DIR,
      DB_FILE,
    ]);
  }
  return joinPath(platform, [
    homeDir,
    "Library",
    "Application Support",
    LEGACY_APP_DIR,
    DB_FILE,
  ]);
}

export function agentLogPaths(
  homeDir = os.homedir(),
  options: PathOptions = {},
): {
  outLog: string;
  errLog: string;
} {
  const platform = resolvePlatform(options);
  if (platform === "win32") {
    const root = joinPath("win32", [windowsAppData(homeDir, options), APP_DIR]);
    return {
      outLog: joinPath("win32", [root, "speedtape.out.log"]),
      errLog: joinPath("win32", [root, "speedtape.err.log"]),
    };
  }
  return {
    outLog: joinPath(platform, [homeDir, "Library", "Logs", "speedtape.out.log"]),
    errLog: joinPath(platform, [homeDir, "Library", "Logs", "speedtape.err.log"]),
  };
}

export function agentPlistPath(
  homeDir = os.homedir(),
  options: PathOptions = {},
): string {
  const platform = resolvePlatform(options);
  return joinPath(platform, [
    homeDir,
    "Library",
    "LaunchAgents",
    `${AGENT_LABEL}.plist`,
  ]);
}

export function scheduleLabel(id: number): string {
  return `${AGENT_LABEL}.${id}`;
}

export function scheduleTaskName(id: number): string {
  return `Speedtape.speedtest.${id}`;
}

export function labeledAgentPlistPath(
  homeDir: string,
  id: number,
  options: PathOptions = {},
): string {
  const platform = resolvePlatform(options);
  return joinPath(platform, [
    homeDir,
    "Library",
    "LaunchAgents",
    `${scheduleLabel(id)}.plist`,
  ]);
}

export function speedtestLockPath(dbPath: string): string {
  return path.join(path.dirname(dbPath), "speedtest.lock");
}

export function legacyAgentPlistPath(
  homeDir = os.homedir(),
  options: PathOptions = {},
): string {
  const platform = resolvePlatform(options);
  return joinPath(platform, [
    homeDir,
    "Library",
    "LaunchAgents",
    `${LEGACY_AGENT_LABEL}.plist`,
  ]);
}

function dataRoot(homeDir: string, options: PathOptions = {}): string {
  const platform = resolvePlatform(options);
  if (platform === "win32") {
    return joinPath("win32", [windowsAppData(homeDir, options), APP_DIR]);
  }
  return joinPath(platform, [
    homeDir,
    "Library",
    "Application Support",
    APP_DIR,
  ]);
}

export function collectorAppPath(
  homeDir = os.homedir(),
  options: PathOptions = {},
): string {
  const platform = resolvePlatform(options);
  return joinPath(platform, [dataRoot(homeDir, options), COLLECTOR_APP_NAME]);
}

export function collectorAppExecutablePath(
  homeDir = os.homedir(),
  options: PathOptions = {},
): string {
  const platform = resolvePlatform(options);
  return joinPath(platform, [
    collectorAppPath(homeDir, options),
    "Contents",
    "MacOS",
    "Speedtape",
  ]);
}
