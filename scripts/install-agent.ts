import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultCollectorRuntime } from "@/lib/collector-runtime";
import { agentRuntimePaths, installSpeedtapeAgents } from "@/lib/agent-sync";
import { withDatabase } from "@/lib/db";
import { prepareDatabasePath } from "@/lib/migrate";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = agentRuntimePaths(projectRoot);

if (!fs.existsSync(runtime.tsxPath)) {
  throw new Error(`tsx not found at ${runtime.tsxPath}. Run npm install first.`);
}

prepareDatabasePath();
withDatabase((db) => {
  installSpeedtapeAgents({
    homeDir: os.homedir(),
    db,
    runtime: defaultCollectorRuntime({
      homeDir: os.homedir(),
      ...runtime,
    }),
    ...runtime,
  });
});
console.log("Installed Speedtape collectors.");
console.log("Add or remove schedules at /app/config, or run npm run uninstall-agent.");
console.log("Tests run while this computer is awake.");
