import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { AGENT_LABEL, LEGACY_AGENT_LABEL } from "@/lib/agent";
import { writeAgentPlist } from "@/lib/launchd";
import { prepareDatabasePath } from "@/lib/migrate";
import { legacyAgentPlistPath } from "@/lib/paths";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveTsx(): string {
  const tsx = path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
  if (!fs.existsSync(tsx)) {
    throw new Error(`tsx not found at ${tsx}. Run npm install first.`);
  }
  return tsx;
}

function pathEnv(): string {
  const extras = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  const current = process.env.PATH?.split(":") ?? [];
  return [...new Set([...extras, ...current])].join(":");
}

function uid(): number {
  return Number(execFileSync("id", ["-u"], { encoding: "utf8" }).trim());
}

function unloadLabel(label: string, plistPath: string): boolean {
  const domain = `gui/${uid()}`;
  try {
    execFileSync("launchctl", ["bootout", `${domain}/${label}`], {
      stdio: "pipe",
    });
    return true;
  } catch {
    try {
      execFileSync("launchctl", ["unload", "-w", plistPath], { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }
}

function loadAgent(plistPath: string): void {
  const domain = `gui/${uid()}`;
  try {
    execFileSync("launchctl", ["bootout", `${domain}/${AGENT_LABEL}`], {
      stdio: "pipe",
    });
  } catch {
    // Agent may not be loaded yet.
  }
  try {
    execFileSync("launchctl", ["bootstrap", domain, plistPath], {
      stdio: "pipe",
    });
  } catch {
    execFileSync("launchctl", ["load", "-w", plistPath], { stdio: "inherit" });
  }
}

prepareDatabasePath();

const legacyPlist = legacyAgentPlistPath();
const legacyPlistExists = fs.existsSync(legacyPlist);
const unloadedLegacy = unloadLabel(LEGACY_AGENT_LABEL, legacyPlist);
if (legacyPlistExists && !unloadedLegacy) {
  console.warn(
    "Could not unload com.home-network-checker.speedtest. Remove ~/Library/LaunchAgents/com.home-network-checker.speedtest.plist by hand if it is still loaded.",
  );
}
if (fs.existsSync(legacyPlist)) {
  fs.unlinkSync(legacyPlist);
}

const plistPath = writeAgentPlist({
  homeDir: os.homedir(),
  projectRoot,
  nodePath: process.execPath,
  tsxPath: resolveTsx(),
  pathEnv: pathEnv(),
});
loadAgent(plistPath);
console.log(`Installed hourly agent: ${AGENT_LABEL}`);
console.log(`Plist: ${plistPath}`);
console.log(
  "A test runs on load, then every 60 minutes while this Mac is awake.",
);
