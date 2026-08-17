export const DOCS_HREF = "/docs";
export const PAGES_DOCS_HREF = "docs.html";
export const DOCS_LABEL = "Docs";
export const DOCS_TITLE = "How to run it.";
export const DOCS_LEDE =
  "Mac and Windows setup, and how an AI agent should run and change this tool.";

export const WINDOWS_BUILD_TOOLS_NOTE =
  "Visual Studio C++ Build Tools are required so npm can compile better-sqlite3.";

const SHARED_SETUP_COMMANDS = [
  { name: "Install dependencies", command: "npm install" },
  { name: "Install agent", command: "npm run install-agent" },
  { name: "Start dashboard", command: "npm run dev" },
] as const;

export const MAC_COMMANDS = [
  {
    name: "Install CLI",
    command: "brew tap teamookla/speedtest && brew install speedtest",
  },
  ...SHARED_SETUP_COMMANDS,
] as const;

export const WINDOWS_COMMANDS = [
  {
    name: "Install CLI",
    command: "winget install -e --id Ookla.Speedtest.CLI",
  },
  ...SHARED_SETUP_COMMANDS,
] as const;

export const AGENT_COMMANDS = [
  {
    name: "Check CLI on Mac",
    command: "command -v speedtest && speedtest --version",
  },
  { name: "Check CLI on Windows", command: "where.exe speedtest" },
  {
    name: "Read logs on Mac",
    command:
      "tail -n 80 ~/Library/Logs/speedtape.out.log ~/Library/Logs/speedtape.err.log",
  },
  {
    name: "Read logs on Windows",
    command:
      'Get-Content -Tail 80 "$env:APPDATA\\speedtape\\speedtape.out.log","$env:APPDATA\\speedtape\\speedtape.err.log"',
  },
  { name: "Run tests", command: "npm test" },
  { name: "Start dashboard", command: "npm run dev" },
  { name: "One-off test", command: "npm run speedtest" },
  { name: "Install collectors", command: "npm run install-agent" },
] as const;

export type GuideCommand = {
  name: string;
  command: string;
};

export type GuideItem = {
  title: string;
  body: string;
};

export type GuidePath = {
  name: string;
  value: string;
};

export type GuideSectionId = "mac" | "windows" | "agents";

export type GuideSection = {
  id: GuideSectionId;
  title: string;
  lede: string;
  items: readonly GuideItem[];
  paths?: readonly GuidePath[];
  commands: readonly GuideCommand[];
  note?: string;
};

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: "mac",
    title: "Mac",
    lede: "Homebrew installs the official Ookla CLI. Collectors then live in LaunchAgents.",
    commands: MAC_COMMANDS,
    items: [
      {
        title: "What you need",
        body: "macOS, Node.js 20+, Homebrew, and the official Ookla Speedtest CLI. The first CLI run may ask you to accept the license. Collectors pass --accept-license and --accept-gdpr so they can run unattended.",
      },
      {
        title: "Setup",
        body: "From the repo root, run the Mac commands in order. Then open http://localhost:3000 and go to /app. From another device on the same Wi-Fi use http://<this-computer-lan-ip>:3000. The dev server listens on all interfaces.",
      },
      {
        title: "After you move the folder",
        body: "Run npm run install-agent again so every collector points at the new path. Closing the browser is fine. The computer must stay awake or the job is skipped.",
      },
    ],
    paths: [
      {
        name: "Plists",
        value: "~/Library/LaunchAgents/com.speedtape.speedtest.<id>.plist",
      },
      {
        name: "Login item",
        value: "~/Library/Application Support/speedtape/Speedtape.app",
      },
      {
        name: "Logs",
        value: "~/Library/Logs/speedtape.out.log and speedtape.err.log",
      },
      {
        name: "Database",
        value: "~/Library/Application Support/speedtape/speedtests.db",
      },
    ],
  },
  {
    id: "windows",
    title: "Windows",
    lede: "Winget installs the CLI. Task Scheduler runs each collector while this computer is awake.",
    commands: WINDOWS_COMMANDS,
    note: WINDOWS_BUILD_TOOLS_NOTE,
    items: [
      {
        title: "What you need",
        body: "Windows, Node.js 20+, Visual Studio C++ Build Tools, and the official Ookla Speedtest CLI. Build Tools are required so npm install can compile better-sqlite3.",
      },
      {
        title: "Setup",
        body: "From the repo root, run the Windows commands in order. Then open http://localhost:3000 and go to /app. From another device on the same Wi-Fi use http://<this-computer-lan-ip>:3000.",
      },
      {
        title: "After you move the folder",
        body: "Run npm run install-agent again so every scheduled task points at the new path. Sleeping skips the job. Closing the dashboard does not.",
      },
    ],
    paths: [
      {
        name: "Tasks",
        value: "Speedtape.speedtest.<id> in Task Scheduler",
      },
      {
        name: "Logs and database",
        value: "%APPDATA%\\speedtape\\",
      },
    ],
  },
  {
    id: "agents",
    title: "AI agents",
    lede: "Speedtape is a local house record. Change the right files, verify with tests, and leave generated collector jobs alone.",
    commands: AGENT_COMMANDS,
    items: [
      {
        title: "What the tool is",
        body: "A speed record for one computer. The official Ookla CLI writes samples into SQLite on this machine. /app is the dashboard: latest run, 24-hour tape, history, and failed gaps. /app/config adds collectors. /app/runs is the archive and CSV export. The public site in docs/ is GitHub Pages only. It is not the dashboard.",
      },
      {
        title: "How the pieces connect",
        body: "app/page.tsx is the local landing. docs/index.html and docs/docs.html are the Pages copies. Keep landing copy and structure in sync. Dashboard routes live under app/app/. lib/ owns the database, schedules, speedtest CLI, and paths. scripts/ owns npm run speedtest, install-agent, and uninstall-agent. Collectors are OS jobs (launchd on Mac, Task Scheduler on Windows), not tests inside the browser.",
      },
      {
        title: "Before you edit",
        body: "Read AGENTS.md. This Next.js has breaking changes, so read node_modules/next/dist/docs/ before writing app code. npm test is Vitest. Add a failing test before a behavior change. The Pages site has no dashboard button. Do not add one. Do not hand-edit generated plists or Task Scheduler jobs. install-agent is the source of truth.",
      },
      {
        title: "How to operate it",
        body: "npm run dev serves landing and dashboard on 0.0.0.0:3000. npm run speedtest runs one sample now. npm run install-agent creates Hourly if none exist, or rewrites every collector. npm run uninstall-agent unloads every Speedtape collector. Schedules are an interval (15 minutes through 24 hours) or clock times. This computer must be awake. If two jobs fire at once, the second waits. Override the database path with SPEEDTAPE_DB.",
      },
      {
        title: "Check Speedtest CLI",
        body: "This repo calls speedtest on Mac and speedtest.exe on Windows (lib/speedtest.ts). On Mac run command -v speedtest && speedtest --version. On Windows run where.exe speedtest. The version line should name Ookla. A missing binary, spawn ENOENT, or the stored error speedtest CLI was not found means it is not installed. The pip package speedtest-cli is the wrong tool. Install with the Mac or Windows commands on this page.",
      },
      {
        title: "Read logs without the dashboard",
        body: "Collectors write stdout to speedtape.out.log and stderr to speedtape.err.log. On Mac those files are in ~/Library/Logs/. On Windows they are in %APPDATA%\\speedtape\\. A successful run prints JSON with testedAt and speeds. A failed run prints Speed test failed: and the error. Missing files mean the collector has not run yet. Saved samples are also in SQLite table speed_tests. Query with SELECT tested_at, download_mbps, error FROM speed_tests ORDER BY id DESC LIMIT 20; against ~/Library/Application Support/speedtape/speedtests.db or %APPDATA%\\speedtape\\speedtests.db, or SPEEDTAPE_DB if it is set.",
      },
    ],
  },
];

export function guideSection(id: GuideSectionId): GuideSection {
  const section = GUIDE_SECTIONS.find((item) => item.id === id);
  if (!section) {
    throw new Error(`Missing guide section: ${id}`);
  }
  return section;
}

export function guideText(): string {
  return GUIDE_SECTIONS.flatMap((section) => [
    section.title,
    section.lede,
    ...section.items.map((item) => `${item.title} ${item.body}`),
    ...(section.paths ?? []).map((path) => `${path.name} ${path.value}`),
    ...(section.note ? [section.note] : []),
    ...section.commands.map((command) => `${command.name} ${command.command}`),
  ]).join("\n");
}
