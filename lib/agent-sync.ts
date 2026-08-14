import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import type { LaunchdCtl } from "@/lib/agent";
import { writeAgentPlist } from "@/lib/launchd";
import {
  AGENT_LABEL,
  LEGACY_AGENT_LABEL,
  agentPlistPath,
  labeledAgentPlistPath,
  legacyAgentPlistPath,
  scheduleLabel,
} from "@/lib/paths";
import {
  cadenceLine,
  deleteAllSchedules,
  deleteSchedule,
  insertSchedule,
  listSchedules,
  toPlistSchedule,
  type ScheduleInput,
  type ScheduleRow,
} from "@/lib/schedules";

export type AgentSyncOptions = {
  homeDir: string;
  db: Database.Database;
  launchd: LaunchdCtl;
  projectRoot: string;
  nodePath: string;
  tsxPath: string;
  pathEnv: string;
};

export function agentRuntimePaths(projectRoot = process.cwd()): {
  projectRoot: string;
  nodePath: string;
  tsxPath: string;
  pathEnv: string;
} {
  const extras = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  const current = process.env.PATH?.split(":") ?? [];
  return {
    projectRoot,
    nodePath: process.execPath,
    tsxPath: path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs"),
    pathEnv: [...new Set([...extras, ...current])].join(":"),
  };
}

function removePlist(plistPath: string): void {
  if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath);
}

function writeAndLoad(
  options: AgentSyncOptions,
  row: ScheduleRow,
): void {
  const plistPath = writeAgentPlist({
    homeDir: options.homeDir,
    projectRoot: options.projectRoot,
    nodePath: options.nodePath,
    tsxPath: options.tsxPath,
    pathEnv: options.pathEnv,
    id: row.id,
    schedule: toPlistSchedule(row),
  });
  options.launchd.load(plistPath);
}

export function importLegacyHourlyIfNeeded(options: AgentSyncOptions): void {
  const unlabeled = agentPlistPath(options.homeDir);
  const present =
    fs.existsSync(unlabeled) || options.launchd.isLoaded(AGENT_LABEL);
  if (!present) return;

  const existing = listSchedules(options.db);
  options.launchd.unload(AGENT_LABEL, unlabeled);
  removePlist(unlabeled);

  if (existing.length > 0) return;

  const row = insertSchedule(options.db, {
    name: "Hourly",
    kind: "interval",
    intervalSeconds: 3600,
  });
  writeAndLoad(options, row);
}

export function installSpeedtapeAgents(options: AgentSyncOptions): void {
  const legacyPlist = legacyAgentPlistPath(options.homeDir);
  options.launchd.unload(LEGACY_AGENT_LABEL, legacyPlist);
  removePlist(legacyPlist);

  importLegacyHourlyIfNeeded(options);

  const rows = listSchedules(options.db);
  if (rows.length === 0) {
    const row = insertSchedule(options.db, {
      name: "Hourly",
      kind: "interval",
      intervalSeconds: 3600,
    });
    writeAndLoad(options, row);
    return;
  }

  for (const row of rows) {
    options.launchd.unload(
      scheduleLabel(row.id),
      labeledAgentPlistPath(options.homeDir, row.id),
    );
    writeAndLoad(options, row);
  }
}

export function uninstallSpeedtapeAgents(options: {
  homeDir: string;
  db: Database.Database;
  launchd: LaunchdCtl;
}): void {
  const agentsDir = path.join(options.homeDir, "Library", "LaunchAgents");
  const names = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir)
    : [];
  for (const name of names) {
    if (
      !name.startsWith(`${AGENT_LABEL}.plist`) &&
      !name.startsWith(`${AGENT_LABEL}.`) &&
      name !== `${LEGACY_AGENT_LABEL}.plist`
    ) {
      continue;
    }
    if (!name.endsWith(".plist")) continue;
    const label = name.slice(0, -".plist".length);
    const plistPath = path.join(agentsDir, name);
    options.launchd.unload(label, plistPath);
    removePlist(plistPath);
  }
  options.launchd.unload(AGENT_LABEL, agentPlistPath(options.homeDir));
  options.launchd.unload(
    LEGACY_AGENT_LABEL,
    legacyAgentPlistPath(options.homeDir),
  );
  deleteAllSchedules(options.db);
}

export type AddAgentResult =
  | { ok: true; row: ScheduleRow }
  | { ok: false; error: string };

export function addScheduledAgent(
  options: AgentSyncOptions & { input: ScheduleInput },
): AddAgentResult {
  const row = insertSchedule(options.db, options.input);
  const plistPath = labeledAgentPlistPath(options.homeDir, row.id);
  try {
    writeAndLoad(options, row);
    return { ok: true, row };
  } catch (err) {
    options.launchd.unload(scheduleLabel(row.id), plistPath);
    removePlist(plistPath);
    deleteSchedule(options.db, row.id);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export type RemoveAgentResult = { ok: true; warning?: string };

export function removeScheduledAgent(options: {
  homeDir: string;
  db: Database.Database;
  launchd: LaunchdCtl;
  id: number;
}): RemoveAgentResult {
  const plistPath = labeledAgentPlistPath(options.homeDir, options.id);
  const unloaded = options.launchd.unload(
    scheduleLabel(options.id),
    plistPath,
  );
  removePlist(plistPath);
  deleteSchedule(options.db, options.id);
  if (!unloaded) {
    return {
      ok: true,
      warning:
        "Removed the collector. Check launchctl list if the old job is still loaded.",
    };
  }
  return { ok: true };
}

export type ConfigAgent = ScheduleRow & {
  cadence: string;
  loaded: boolean;
};

export function loadConfigAgents(options: AgentSyncOptions): ConfigAgent[] {
  importLegacyHourlyIfNeeded(options);
  return listSchedules(options.db).map((row) => ({
    ...row,
    cadence: cadenceLine(row),
    loaded: options.launchd.isLoaded(scheduleLabel(row.id)),
  }));
}
