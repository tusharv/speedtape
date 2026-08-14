import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { AGENT_LABEL, LEGACY_AGENT_LABEL } from "@/lib/agent";
import { agentPlistPath } from "@/lib/launchd";
import { legacyAgentPlistPath } from "@/lib/paths";

function uid(): number {
  return Number(execFileSync("id", ["-u"], { encoding: "utf8" }).trim());
}

function unload(label: string, plistPath: string): void {
  const domain = `gui/${uid()}`;
  try {
    execFileSync("launchctl", ["bootout", `${domain}/${label}`], {
      stdio: "pipe",
    });
  } catch {
    try {
      execFileSync("launchctl", ["unload", "-w", plistPath], { stdio: "pipe" });
    } catch {
      // Already unloaded.
    }
  }
}

const homeDir = os.homedir();
const plistPath = agentPlistPath(homeDir);
const legacyPlist = legacyAgentPlistPath(homeDir);

unload(AGENT_LABEL, plistPath);
unload(LEGACY_AGENT_LABEL, legacyPlist);

if (fs.existsSync(plistPath)) {
  fs.unlinkSync(plistPath);
}
if (fs.existsSync(legacyPlist)) {
  fs.unlinkSync(legacyPlist);
}

console.log(`Removed hourly agent: ${AGENT_LABEL}`);
