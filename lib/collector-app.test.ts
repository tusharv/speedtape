import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  COLLECTOR_BUNDLE_ID,
  collectorAppExecutablePath,
  collectorAppPath,
} from "@/lib/paths";
import { ensureCollectorApp, removeCollectorApp } from "@/lib/collector-app";

const tmpDirs: string[] = [];

function tempHome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "st-app-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("ensureCollectorApp", () => {
  it("writes a Speedtape.app with display name, icon, and a node wrapper", () => {
    const homeDir = tempHome();
    const appPath = ensureCollectorApp({
      homeDir,
      nodePath: "/opt/homebrew/bin/node",
      tsxPath: "/Users/tushar/proj/node_modules/tsx/dist/cli.mjs",
      scriptPath: "/Users/tushar/proj/scripts/run-speedtest.ts",
      workdir: "/Users/tushar/proj",
      pathEnv: "/opt/homebrew/bin:/usr/bin",
    });

    expect(appPath).toBe(collectorAppPath(homeDir));
    const info = fs.readFileSync(
      path.join(appPath, "Contents", "Info.plist"),
      "utf8",
    );
    expect(info).toContain("<string>Speedtape</string>");
    expect(info).toContain(`<string>${COLLECTOR_BUNDLE_ID}</string>`);
    expect(info).toContain("<key>CFBundleDisplayName</key>");
    expect(info).toContain("<key>CFBundleIconFile</key>");
    expect(info).toContain("<string>AppIcon</string>");

    const iconPath = path.join(
      appPath,
      "Contents",
      "Resources",
      "AppIcon.icns",
    );
    expect(fs.existsSync(iconPath)).toBe(true);
    expect(fs.statSync(iconPath).size).toBeGreaterThan(100);

    const bin = collectorAppExecutablePath(homeDir);
    expect(fs.existsSync(bin)).toBe(true);
    const script = fs.readFileSync(bin, "utf8");
    expect(script).toContain("/opt/homebrew/bin/node");
    expect(script).toContain("/Users/tushar/proj/scripts/run-speedtest.ts");
    expect(fs.statSync(bin).mode & 0o111).toBeTruthy();
  });

  it("removes the Login Items app", () => {
    const homeDir = tempHome();
    ensureCollectorApp({
      homeDir,
      nodePath: "/usr/bin/node",
      tsxPath: "/tmp/tsx.mjs",
      scriptPath: "/tmp/run-speedtest.ts",
      workdir: "/tmp",
      pathEnv: "/usr/bin",
    });
    removeCollectorApp(homeDir);
    expect(fs.existsSync(collectorAppPath(homeDir))).toBe(false);
  });
});
