import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AGENT_LABEL, agentLogPaths, agentPlistPath } from "@/lib/paths";

export { agentPlistPath };

export type PlistPaths = {
  nodePath: string;
  tsxPath: string;
  scriptPath: string;
  workdir: string;
  pathEnv: string;
  outLog: string;
  errLog: string;
};

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function generatePlist(paths: PlistPaths): string {
  const nodePath = xmlEscape(paths.nodePath);
  const tsxPath = xmlEscape(paths.tsxPath);
  const scriptPath = xmlEscape(paths.scriptPath);
  const workdir = xmlEscape(paths.workdir);
  const pathEnv = xmlEscape(paths.pathEnv);
  const outLog = xmlEscape(paths.outLog);
  const errLog = xmlEscape(paths.errLog);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${tsxPath}</string>
    <string>${scriptPath}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${workdir}</string>
  <key>StartInterval</key>
  <integer>3600</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${outLog}</string>
  <key>StandardErrorPath</key>
  <string>${errLog}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${pathEnv}</string>
  </dict>
</dict>
</plist>
`;
}

export function writeAgentPlist(options: {
  homeDir?: string;
  projectRoot: string;
  nodePath: string;
  tsxPath: string;
  pathEnv: string;
}): string {
  const homeDir = options.homeDir ?? os.homedir();
  const plistPath = agentPlistPath(homeDir);
  const logs = agentLogPaths(homeDir);
  fs.mkdirSync(path.dirname(plistPath), { recursive: true });
  fs.mkdirSync(path.join(homeDir, "Library", "Logs"), { recursive: true });
  const xml = generatePlist({
    nodePath: options.nodePath,
    tsxPath: options.tsxPath,
    scriptPath: path.join(options.projectRoot, "scripts", "run-speedtest.ts"),
    workdir: options.projectRoot,
    pathEnv: options.pathEnv,
    outLog: logs.outLog,
    errLog: logs.errLog,
  });
  fs.writeFileSync(plistPath, xml);
  return plistPath;
}
