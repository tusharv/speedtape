import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { LaunchdCtl } from "@/lib/agent";
import {
  addScheduledAgent,
  importLegacyHourlyIfNeeded,
  installSpeedtapeAgents,
  removeScheduledAgent,
  uninstallSpeedtapeAgents,
} from "@/lib/agent-sync";
import { openDatabase } from "@/lib/db";
import { AGENT_LABEL, agentPlistPath, labeledAgentPlistPath } from "@/lib/paths";
import { insertSchedule, listSchedules } from "@/lib/schedules";

const tmpDirs: string[] = [];

function tempHome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "st-home-"));
  tmpDirs.push(dir);
  fs.mkdirSync(path.join(dir, "Library", "LaunchAgents"), { recursive: true });
  return dir;
}

function memoryLaunchd(): LaunchdCtl & { loaded: Set<string> } {
  const loaded = new Set<string>();
  return {
    loaded,
    isLoaded: (label) => loaded.has(label),
    load: (plistPath) => {
      const name = path.basename(plistPath, ".plist");
      loaded.add(name);
    },
    unload: (label) => {
      const had = loaded.has(label);
      loaded.delete(label);
      return had;
    },
  };
}

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const paths = {
  projectRoot: "/Users/tushar/proj",
  nodePath: "/opt/homebrew/bin/node",
  tsxPath: "/Users/tushar/proj/node_modules/tsx/dist/cli.mjs",
  pathEnv: "/usr/bin",
};

describe("importLegacyHourlyIfNeeded", () => {
  it("turns the unlabeled hourly plist into a Hourly schedule", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    fs.writeFileSync(agentPlistPath(homeDir), "<plist/>");
    const launchd = memoryLaunchd();
    launchd.loaded.add(AGENT_LABEL);

    importLegacyHourlyIfNeeded({
      homeDir,
      db,
      launchd,
      ...paths,
    });

    const rows = listSchedules(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Hourly");
    expect(rows[0]?.kind).toBe("interval");
    expect(fs.existsSync(agentPlistPath(homeDir))).toBe(false);
    expect(fs.existsSync(labeledAgentPlistPath(homeDir, rows[0]!.id))).toBe(
      true,
    );
    expect(launchd.loaded.has(AGENT_LABEL)).toBe(false);
    expect(launchd.loaded.has(`com.speedtape.speedtest.${rows[0]!.id}`)).toBe(
      true,
    );
    db.close();
  });

  it("removes the unlabeled plist without adding a row when schedules exist", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    insertSchedule(db, {
      name: "Evening",
      kind: "clock",
      times: ["18:00"],
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    });
    fs.writeFileSync(agentPlistPath(homeDir), "<plist/>");
    const launchd = memoryLaunchd();
    launchd.loaded.add(AGENT_LABEL);

    importLegacyHourlyIfNeeded({
      homeDir,
      db,
      launchd,
      ...paths,
    });

    expect(listSchedules(db)).toHaveLength(1);
    expect(listSchedules(db)[0]?.name).toBe("Evening");
    expect(fs.existsSync(agentPlistPath(homeDir))).toBe(false);
    expect(launchd.loaded.has(AGENT_LABEL)).toBe(false);
    db.close();
  });
});

describe("installSpeedtapeAgents", () => {
  it("creates Hourly when there are no schedules", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    const launchd = memoryLaunchd();

    installSpeedtapeAgents({
      homeDir,
      db,
      launchd,
      ...paths,
    });

    const rows = listSchedules(db);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Hourly");
    expect(launchd.loaded.size).toBe(1);
    db.close();
  });

  it("rewrites existing schedule plists instead of adding Hourly", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    const existing = insertSchedule(db, {
      name: "Daytime",
      kind: "interval",
      intervalSeconds: 900,
    });
    const launchd = memoryLaunchd();

    installSpeedtapeAgents({
      homeDir,
      db,
      launchd,
      ...paths,
    });

    expect(listSchedules(db)).toHaveLength(1);
    expect(fs.existsSync(labeledAgentPlistPath(homeDir, existing.id))).toBe(
      true,
    );
    expect(
      fs.readFileSync(labeledAgentPlistPath(homeDir, existing.id), "utf8"),
    ).toContain("<integer>900</integer>");
    db.close();
  });
});

describe("uninstallSpeedtapeAgents", () => {
  it("unloads every Speedtape plist and deletes schedule rows, not samples", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    const row = insertSchedule(db, {
      name: "Hourly",
      kind: "interval",
      intervalSeconds: 3600,
    });
    const plist = labeledAgentPlistPath(homeDir, row.id);
    fs.writeFileSync(plist, "<plist/>");
    fs.writeFileSync(agentPlistPath(homeDir), "<plist/>");
    db.prepare(
      `INSERT INTO speed_tests (tested_at, download_mbps, upload_mbps, ping_ms, jitter_ms, packet_loss, isp, server_name, server_location, error)
       VALUES ('2026-08-14T00:00:00.000Z', 1, 1, 1, 1, 0, 'x', 'x', 'x', NULL)`,
    ).run();
    const launchd = memoryLaunchd();
    launchd.loaded.add(`com.speedtape.speedtest.${row.id}`);
    launchd.loaded.add(AGENT_LABEL);

    uninstallSpeedtapeAgents({ homeDir, db, launchd });

    expect(listSchedules(db)).toEqual([]);
    expect(fs.existsSync(plist)).toBe(false);
    expect(fs.existsSync(agentPlistPath(homeDir))).toBe(false);
    expect(launchd.loaded.size).toBe(0);
    const remaining = db
      .prepare("SELECT COUNT(*) AS n FROM speed_tests")
      .get() as { n: number };
    expect(remaining.n).toBe(1);
    db.close();
  });
});

describe("addScheduledAgent", () => {
  it("inserts a row, writes a plist, and loads it", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    const launchd = memoryLaunchd();
    const result = addScheduledAgent({
      homeDir,
      db,
      launchd,
      ...paths,
      input: {
        name: "Daytime",
        kind: "interval",
        intervalSeconds: 900,
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.name).toBe("Daytime");
    expect(fs.existsSync(labeledAgentPlistPath(homeDir, result.row.id))).toBe(
      true,
    );
    expect(launchd.loaded.has(`com.speedtape.speedtest.${result.row.id}`)).toBe(
      true,
    );
    db.close();
  });

  it("rolls back the row and plist when load fails", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    const launchd = memoryLaunchd();
    launchd.load = () => {
      throw new Error("bootstrap failed");
    };
    const result = addScheduledAgent({
      homeDir,
      db,
      launchd,
      ...paths,
      input: {
        name: "Daytime",
        kind: "interval",
        intervalSeconds: 900,
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("bootstrap failed");
    expect(listSchedules(db)).toEqual([]);
    expect(fs.readdirSync(path.join(homeDir, "Library", "LaunchAgents"))).toEqual(
      [],
    );
    db.close();
  });
});

describe("removeScheduledAgent", () => {
  it("unloads, deletes the plist, and deletes the row even if bootout fails", () => {
    const homeDir = tempHome();
    const db = openDatabase(path.join(homeDir, "speedtests.db"));
    const row = insertSchedule(db, {
      name: "Hourly",
      kind: "interval",
      intervalSeconds: 3600,
    });
    fs.writeFileSync(labeledAgentPlistPath(homeDir, row.id), "<plist/>");
    const launchd = memoryLaunchd();
    launchd.unload = () => false;
    const result = removeScheduledAgent({
      homeDir,
      db,
      launchd,
      id: row.id,
    });
    expect(result.ok).toBe(true);
    expect(result.warning).toMatch(/launchctl/i);
    expect(listSchedules(db)).toEqual([]);
    expect(fs.existsSync(labeledAgentPlistPath(homeDir, row.id))).toBe(false);
    db.close();
  });
});
