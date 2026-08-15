import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { LaunchdCtl } from "@/lib/agent";
import {
  defaultCollectorRuntime,
  launchdCollectorRuntime,
  schtasksCollectorRuntime,
  unsupportedCollectorRuntime,
} from "@/lib/collector-runtime";
import type { SchtasksCtl } from "@/lib/schtasks";
import type { ScheduleRow } from "@/lib/schedules";

const command = {
  projectRoot: "/Users/tushar/proj",
  nodePath: "/opt/homebrew/bin/node",
  tsxPath: "/Users/tushar/proj/node_modules/tsx/dist/cli.mjs",
  pathEnv: "/usr/bin",
};

const hourly: ScheduleRow = {
  id: 3,
  name: "Hourly",
  kind: "interval",
  intervalSeconds: 3600,
  createdAt: "2026-08-15T00:00:00.000Z",
};

const tmpDirs: string[] = [];

function tempHome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "st-runtime-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("launchdCollectorRuntime", () => {
  it("loads and unloads by schedule id using launchd labels", () => {
    const homeDir = tempHome();
    const loaded = new Set<string>();
    const launchd: LaunchdCtl = {
      isLoaded: (label) => loaded.has(label),
      load: (plistPath) => {
        loaded.add(plistPath.split("/").pop()?.replace(/\.plist$/, "") ?? "");
      },
      unload: (label) => loaded.delete(label),
    };
    const runtime = launchdCollectorRuntime({
      homeDir,
      launchd,
      ...command,
    });
    runtime.install(hourly);
    expect(runtime.isLoaded(3)).toBe(true);
    expect(runtime.uninstall(3)).toBe(true);
    expect(runtime.isLoaded(3)).toBe(false);
  });
});

describe("schtasksCollectorRuntime", () => {
  it("creates and deletes Speedtape.speedtest tasks", () => {
    const loaded = new Set<string>();
    const created: string[] = [];
    const schtasks: SchtasksCtl = {
      isLoaded: (name) => loaded.has(name),
      create: (name, xml) => {
        loaded.add(name);
        created.push(xml);
      },
      delete: (name) => loaded.delete(name),
    };
    const runtime = schtasksCollectorRuntime({
      homeDir: "C:\\Users\\tushar",
      schtasks,
      projectRoot: "C:\\proj",
      nodePath: "C:\\nodejs\\node.exe",
      tsxPath: "C:\\proj\\node_modules\\tsx\\dist\\cli.mjs",
      pathEnv: "C:\\Windows",
    });
    runtime.install(hourly);
    expect(runtime.isLoaded(3)).toBe(true);
    expect(created[0]).toContain("<Interval>PT60M</Interval>");
    expect(runtime.uninstall(3)).toBe(true);
    expect(runtime.isLoaded(3)).toBe(false);
  });
});

describe("defaultCollectorRuntime", () => {
  it("uses launchd on macOS, schtasks on Windows, and errors elsewhere", () => {
    expect(
      defaultCollectorRuntime({
        homeDir: "/Users/tushar",
        platform: "darwin",
        ...command,
      }).kind,
    ).toBe("launchd");
    expect(
      defaultCollectorRuntime({
        homeDir: "C:\\Users\\tushar",
        platform: "win32",
        ...command,
      }).kind,
    ).toBe("schtasks");
    const other = unsupportedCollectorRuntime();
    expect(other.kind).toBe("unsupported");
    expect(other.isLoaded(1)).toBe(false);
    expect(() => other.install(hourly)).toThrow(/macOS or Windows/i);
  });
});
