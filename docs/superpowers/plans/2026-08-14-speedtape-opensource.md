# Speedtape Open Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the app as Speedtape: MIT-licensed landing at `/`, meter at `/app`, one Geist/teal look, and a copy of existing SQLite history into the new disk paths.

**Architecture:** Pure path and migrate helpers run before SQLite open so old samples are copied, not overwritten. Next.js App Router moves the dashboard under `app/app/`. Shared CSS tokens remap copper to teal and add light/dark. Landing is a static page that renders the real `SpeedTape` with sample cells.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, better-sqlite3, Vitest, launchd.

**Spec:** `docs/superpowers/specs/2026-08-14-speedtape-opensource-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `lib/site.ts` | `APP_NAME`, `GITHUB_URL`, `LICENSE_LABEL` |
| Create: `lib/paths.ts` | New and legacy Application Support, log, and plist paths |
| Create: `lib/migrate.ts` | `migrateLegacyDatabase`, `prepareDatabasePath` |
| Create: `lib/migrate.test.ts` | Copy, skip, WAL, row-count, prepare-before-create |
| Create: `lib/landing-tape.ts` | Fixed 24 sample `TapeCell`s |
| Create: `lib/landing-tape.test.ts` | Length 24 |
| Create: `app/app/page.tsx` | Current dashboard (moved) |
| Create: `app/app/runs/page.tsx` | Current archive (moved) |
| Create: `app/app/runs/[id]/page.tsx` | Current run detail (moved) |
| Create: `LICENSE` | MIT |
| Create: `launchd/com.speedtape.speedtest.plist.template` | Renamed template |
| Modify: `lib/db.ts` | `SPEEDTAPE_DB`, `withDatabase` uses `prepareDatabasePath` |
| Modify: `lib/db.test.ts` | New default path |
| Modify: `lib/dashboard.test.ts` | `SPEEDTAPE_DB` |
| Modify: `lib/agent.ts` | New and legacy LaunchAgent labels |
| Modify: `lib/launchd.ts` | New log names, legacy plist helper |
| Modify: `lib/launchd.test.ts` | New log path and label |
| Modify: `lib/runs.ts` | `/app` hrefs |
| Modify: `lib/runs.test.ts` | `/app` assertions |
| Modify: `scripts/install-agent.ts` | Migrate, unload legacy, load new |
| Modify: `scripts/uninstall-agent.ts` | Unload new and legacy |
| Modify: `next.config.ts` | `/runs` redirects |
| Modify: `app/page.tsx` | Landing |
| Modify: `app/layout.tsx` | Geist, Speedtape metadata |
| Modify: `app/globals.css` | Teal/zinc tokens, light/dark, 8px radius |
| Modify: `app/components/site-nav.tsx` | Dashboard / Runs / Speedtape |
| Modify: `app/not-found.tsx` | Speedtape copy |
| Modify: `package.json` | `name: speedtape`, `license: MIT` |
| Modify: `README.md` | Clone-and-run under Speedtape |
| Delete: `launchd/com.home-network-checker.speedtest.plist.template` | Replaced |
| Delete: `app/runs/page.tsx`, `app/runs/[id]/page.tsx` | After move |

Do not change tape grouping, chart downsample, run filters, Ookla flags, or SQLite schema.

---

### Task 1: Site constants

**Files:**
- Create: `lib/site.ts`
- Create: `lib/site.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { APP_NAME, GITHUB_URL, LICENSE_LABEL } from "@/lib/site";

describe("site", () => {
  it("names the public project", () => {
    expect(APP_NAME).toBe("Speedtape");
    expect(LICENSE_LABEL).toBe("MIT");
    expect(GITHUB_URL).toBe(
      "https://github.com/tusharvagela/home-network-checker",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/site.test.ts`

Expected: FAIL with `Cannot find module '@/lib/site'`

- [ ] **Step 3: Write minimal implementation**

```ts
export const APP_NAME = "Speedtape";
export const LICENSE_LABEL = "MIT";
export const GITHUB_URL =
  "https://github.com/tusharvagela/home-network-checker";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/site.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/site.ts lib/site.test.ts
git commit -m "$(cat <<'EOF'
Name the public project Speedtape.

EOF
)"
```

---

### Task 2: New and legacy disk paths

**Files:**
- Create: `lib/paths.ts`
- Create: `lib/paths.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  APP_DIR,
  LEGACY_APP_DIR,
  defaultDbPath,
  legacyDbPath,
  agentLogPaths,
  agentPlistPath,
  legacyAgentPlistPath,
} from "@/lib/paths";

const home = "/Users/tushar";

describe("paths", () => {
  it("puts Speedtape under Application Support and keeps the old folder name", () => {
    expect(APP_DIR).toBe("speedtape");
    expect(LEGACY_APP_DIR).toBe("home-network-checker");
    expect(defaultDbPath(home)).toBe(
      "/Users/tushar/Library/Application Support/speedtape/speedtests.db",
    );
    expect(legacyDbPath(home)).toBe(
      "/Users/tushar/Library/Application Support/home-network-checker/speedtests.db",
    );
  });

  it("names launchd logs and plists", () => {
    expect(agentLogPaths(home)).toEqual({
      outLog: "/Users/tushar/Library/Logs/speedtape.out.log",
      errLog: "/Users/tushar/Library/Logs/speedtape.err.log",
    });
    expect(agentPlistPath(home)).toBe(
      path.join(home, "Library", "LaunchAgents", "com.speedtape.speedtest.plist"),
    );
    expect(legacyAgentPlistPath(home)).toBe(
      path.join(
        home,
        "Library",
        "LaunchAgents",
        "com.home-network-checker.speedtest.plist",
      ),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/paths.test.ts`

Expected: FAIL with `Cannot find module '@/lib/paths'`

- [ ] **Step 3: Write minimal implementation**

```ts
import os from "node:os";
import path from "node:path";

export const APP_DIR = "speedtape";
export const LEGACY_APP_DIR = "home-network-checker";
export const DB_FILE = "speedtests.db";
export const AGENT_LABEL = "com.speedtape.speedtest";
export const LEGACY_AGENT_LABEL = "com.home-network-checker.speedtest";

export function defaultDbPath(homeDir = os.homedir()): string {
  return path.join(
    homeDir,
    "Library",
    "Application Support",
    APP_DIR,
    DB_FILE,
  );
}

export function legacyDbPath(homeDir = os.homedir()): string {
  return path.join(
    homeDir,
    "Library",
    "Application Support",
    LEGACY_APP_DIR,
    DB_FILE,
  );
}

export function agentLogPaths(homeDir = os.homedir()): {
  outLog: string;
  errLog: string;
} {
  return {
    outLog: path.join(homeDir, "Library", "Logs", "speedtape.out.log"),
    errLog: path.join(homeDir, "Library", "Logs", "speedtape.err.log"),
  };
}

export function agentPlistPath(homeDir = os.homedir()): string {
  return path.join(homeDir, "Library", "LaunchAgents", `${AGENT_LABEL}.plist`);
}

export function legacyAgentPlistPath(homeDir = os.homedir()): string {
  return path.join(
    homeDir,
    "Library",
    "LaunchAgents",
    `${LEGACY_AGENT_LABEL}.plist`,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/paths.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/paths.ts lib/paths.test.ts
git commit -m "$(cat <<'EOF'
Define Speedtape and legacy disk paths.

EOF
)"
```

---

### Task 3: Copy old SQLite before creating the new file

**Files:**
- Create: `lib/migrate.ts`
- Create: `lib/migrate.test.ts`

Use temp home directories only. Never write to the real `~/Library`.

- [ ] **Step 1: Write the failing tests**

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { defaultDbPath, legacyDbPath } from "@/lib/paths";
import {
  migrateLegacyDatabase,
  prepareDatabasePath,
} from "@/lib/migrate";
import { openDatabase, insertSpeedTest } from "@/lib/db";

const tmpDirs: string[] = [];

function tempHome(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "speedtape-home-"));
  tmpDirs.push(dir);
  return dir;
}

function seedLegacy(homeDir: string, rows: number): void {
  const file = legacyDbPath(homeDir);
  const db = openDatabase(file);
  for (let i = 0; i < rows; i += 1) {
    insertSpeedTest(db, {
      testedAt: `2026-08-13T0${i}:00:00.000Z`,
      downloadMbps: 100 + i,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Austin, TX",
      error: null,
    });
  }
  db.close();
}

afterEach(() => {
  delete process.env.SPEEDTAPE_DB;
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("migrateLegacyDatabase", () => {
  it("copies legacy rows into the new path and leaves the old file", () => {
    const home = tempHome();
    seedLegacy(home, 3);
    const result = migrateLegacyDatabase(home);
    expect(result).toEqual({ status: "copied", rows: 3 });
    const dest = openDatabase(defaultDbPath(home));
    const count = dest.prepare("SELECT COUNT(*) AS n FROM speed_tests").get() as {
      n: number;
    };
    expect(count.n).toBe(3);
    dest.close();
    expect(fs.existsSync(legacyDbPath(home))).toBe(true);
  });

  it("copies wal and shm siblings when present", () => {
    const home = tempHome();
    const file = legacyDbPath(home);
    const db = openDatabase(file);
    db.pragma("journal_mode = WAL");
    insertSpeedTest(db, {
      testedAt: "2026-08-13T01:00:00.000Z",
      downloadMbps: 100,
      uploadMbps: 20,
      pingMs: 8,
      jitterMs: 1,
      packetLoss: 0,
      isp: "ISP",
      serverName: "Server",
      serverLocation: "Austin, TX",
      error: null,
    });
    db.close();
    expect(fs.existsSync(`${file}-wal`)).toBe(true);
    migrateLegacyDatabase(home);
    const dest = defaultDbPath(home);
    expect(fs.existsSync(`${dest}-wal`)).toBe(true);
  });

  it("is a no-op when the new db already exists", () => {
    const home = tempHome();
    seedLegacy(home, 2);
    fs.mkdirSync(path.dirname(defaultDbPath(home)), { recursive: true });
    fs.writeFileSync(defaultDbPath(home), "existing");
    expect(migrateLegacyDatabase(home)).toEqual({
      status: "skipped",
      reason: "dest-exists",
    });
    expect(fs.readFileSync(defaultDbPath(home), "utf8")).toBe("existing");
  });

  it("is a no-op when legacy is missing", () => {
    const home = tempHome();
    expect(migrateLegacyDatabase(home)).toEqual({
      status: "skipped",
      reason: "no-legacy",
    });
    expect(fs.existsSync(defaultDbPath(home))).toBe(false);
  });
});

describe("prepareDatabasePath", () => {
  it("returns SPEEDTAPE_DB without migrating", () => {
    const home = tempHome();
    seedLegacy(home, 1);
    process.env.SPEEDTAPE_DB = "/tmp/override.db";
    expect(prepareDatabasePath(home)).toBe("/tmp/override.db");
    expect(fs.existsSync(defaultDbPath(home))).toBe(false);
  });

  it("copies legacy data before any new empty speedtests.db is created", () => {
    const home = tempHome();
    seedLegacy(home, 2);
    const prepared = prepareDatabasePath(home);
    expect(prepared).toBe(defaultDbPath(home));
    expect(fs.existsSync(prepared)).toBe(true);
    const db = new Database(prepared, { readonly: true, fileMustExist: true });
    const count = db.prepare("SELECT COUNT(*) AS n FROM speed_tests").get() as {
      n: number;
    };
    db.close();
    expect(count.n).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/migrate.test.ts`

Expected: FAIL with `Cannot find module '@/lib/migrate'`

- [ ] **Step 3: Write minimal implementation**

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { defaultDbPath, legacyDbPath } from "@/lib/paths";

export type MigrateResult =
  | { status: "copied"; rows: number }
  | { status: "skipped"; reason: "dest-exists" | "no-legacy" };

function sidecar(filePath: string): string[] {
  return [`${filePath}-wal`, `${filePath}-shm`];
}

function countRows(filePath: string): number {
  const db = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    const row = db.prepare("SELECT COUNT(*) AS n FROM speed_tests").get() as {
      n: number;
    };
    return row.n;
  } finally {
    db.close();
  }
}

function removeDest(dest: string): void {
  for (const file of [dest, ...sidecar(dest)]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

export function migrateLegacyDatabase(
  homeDir = os.homedir(),
): MigrateResult {
  const dest = defaultDbPath(homeDir);
  const src = legacyDbPath(homeDir);
  if (fs.existsSync(dest)) {
    return { status: "skipped", reason: "dest-exists" };
  }
  if (!fs.existsSync(src)) {
    return { status: "skipped", reason: "no-legacy" };
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.copyFileSync(src, dest);
    for (const extra of sidecar(src)) {
      if (fs.existsSync(extra)) {
        fs.copyFileSync(extra, extra.replace(src, dest));
      }
    }
    const rows = countRows(src);
    const copied = countRows(dest);
    if (copied !== rows) {
      removeDest(dest);
      throw new Error(
        `Speedtape migrate copied ${copied} rows from ${src} into ${dest}, expected ${rows}`,
      );
    }
    return { status: "copied", rows };
  } catch (err) {
    removeDest(dest);
    if (err instanceof Error && err.message.startsWith("Speedtape migrate")) {
      throw err;
    }
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Speedtape could not copy ${src} to ${dest}: ${detail}`,
    );
  }
}

export function prepareDatabasePath(homeDir = os.homedir()): string {
  if (process.env.SPEEDTAPE_DB) return process.env.SPEEDTAPE_DB;
  migrateLegacyDatabase(homeDir);
  return defaultDbPath(homeDir);
}
```

Sidecar copy: `extra.replace(src, dest)` is correct because wal/shm paths are `${src}-wal`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/migrate.test.ts`

Expected: PASS. If the WAL test fails because `countRows` on dest also opens WAL, keep the wal files as extra siblings and only count the main db.

- [ ] **Step 5: Commit**

```bash
git add lib/migrate.ts lib/migrate.test.ts
git commit -m "$(cat <<'EOF'
Copy legacy speedtests into the Speedtape folder before first open.

EOF
)"
```

---

### Task 4: Point SQLite at Speedtape and migrate on open

**Files:**
- Modify: `lib/db.ts`
- Modify: `lib/db.test.ts`
- Modify: `lib/dashboard.test.ts`

- [ ] **Step 1: Write the failing test**

In `lib/db.test.ts` change the `defaultDbPath` assertion to:

```ts
expect(defaultDbPath("/Users/tushar")).toBe(
  "/Users/tushar/Library/Application Support/speedtape/speedtests.db",
);
```

Add:

```ts
import { resolveDbPath } from "@/lib/db";

describe("resolveDbPath", () => {
  it("reads SPEEDTAPE_DB", () => {
    const previous = process.env.SPEEDTAPE_DB;
    process.env.SPEEDTAPE_DB = "/tmp/custom.db";
    expect(resolveDbPath()).toBe("/tmp/custom.db");
    if (previous === undefined) delete process.env.SPEEDTAPE_DB;
    else process.env.SPEEDTAPE_DB = previous;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/db.test.ts`

Expected: FAIL on `home-network-checker` vs `speedtape`, and `resolveDbPath` / `SPEEDTAPE_DB`.

- [ ] **Step 3: Write minimal implementation**

In `lib/db.ts`:

- Remove local `APP_DIR` / `DB_FILE`.
- Import `defaultDbPath` from `@/lib/paths` and re-export it.
- Change `resolveDbPath` to `process.env.SPEEDTAPE_DB ?? defaultDbPath()`.
- Change `withDatabase` to `openDatabase(prepareDatabasePath())`.
- Import `prepareDatabasePath` from `@/lib/migrate`.

In `lib/dashboard.test.ts` replace every `HOME_NETWORK_CHECKER_DB` with `SPEEDTAPE_DB`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/db.test.ts lib/dashboard.test.ts lib/migrate.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/db.test.ts lib/dashboard.test.ts
git commit -m "$(cat <<'EOF'
Open SQLite at the Speedtape path after migrating old data.

EOF
)"
```

---

### Task 5: Rename the LaunchAgent

**Files:**
- Modify: `lib/agent.ts`
- Modify: `lib/launchd.ts`
- Modify: `lib/launchd.test.ts`
- Create: `launchd/com.speedtape.speedtest.plist.template`
- Delete: `launchd/com.home-network-checker.speedtest.plist.template`

- [ ] **Step 1: Write the failing test**

In `lib/launchd.test.ts` change log path strings to `speedtape.out.log` / `speedtape.err.log`. Add:

```ts
expect(xml).toContain("<string>com.speedtape.speedtest</string>");
expect(xml).toContain("/Users/tushar/Library/Logs/speedtape.out.log");
```

Update `AGENT_LABEL` import expectations: the plist path must end with `com.speedtape.speedtest.plist`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/launchd.test.ts`

Expected: FAIL on old label / log names.

- [ ] **Step 3: Write minimal implementation**

`lib/agent.ts`:

```ts
import { execFileSync } from "node:child_process";
import { AGENT_LABEL, LEGACY_AGENT_LABEL } from "@/lib/paths";

export { AGENT_LABEL, LEGACY_AGENT_LABEL };

export function isAgentLoaded(label = AGENT_LABEL): boolean {
  try {
    execFileSync("launchctl", ["list", label], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
```

`lib/launchd.ts`: import `AGENT_LABEL`, `agentLogPaths`, `agentPlistPath` from `@/lib/paths`. `writeAgentPlist` uses `agentLogPaths(homeDir)` instead of `home-network-checker.*.log`. Re-export `agentPlistPath` from paths (or keep a wrapper that calls paths).

Copy `launchd/com.home-network-checker.speedtest.plist.template` to `launchd/com.speedtape.speedtest.plist.template` and set Label to `com.speedtape.speedtest`. Delete the old template.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/launchd.test.ts lib/paths.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/agent.ts lib/launchd.ts lib/launchd.test.ts launchd/
git commit -m "$(cat <<'EOF'
Rename the hourly LaunchAgent to com.speedtape.speedtest.

EOF
)"
```

---

### Task 6: Install and uninstall cut over the old agent

**Files:**
- Modify: `scripts/install-agent.ts`
- Modify: `scripts/uninstall-agent.ts`

These scripts call `launchctl`. Do not run them against the real Mac in this task. Path and migrate coverage is in unit tests.

- [ ] **Step 1: Update install-agent.ts**

At the top of the install script, after resolving `projectRoot`:

```ts
import { AGENT_LABEL, LEGACY_AGENT_LABEL, legacyAgentPlistPath } from "@/lib/paths";
import { prepareDatabasePath } from "@/lib/migrate";
```

Before `writeAgentPlist`:

```ts
prepareDatabasePath();

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

const legacyPlist = legacyAgentPlistPath();
const unloadedLegacy = unloadLabel(LEGACY_AGENT_LABEL, legacyPlist);
if (!unloadedLegacy) {
  console.warn(
    "Could not unload com.home-network-checker.speedtest. Remove ~/Library/LaunchAgents/com.home-network-checker.speedtest.plist by hand if it is still loaded.",
  );
}
if (fs.existsSync(legacyPlist)) {
  fs.unlinkSync(legacyPlist);
}
```

If `prepareDatabasePath()` throws, do not write the new plist (let the process crash with the migrate error). After a successful copy, if unload of the legacy label fails, print:

```
Could not unload com.home-network-checker.speedtest. Remove ~/Library/LaunchAgents/com.home-network-checker.speedtest.plist by hand if it is still loaded.
```

Then write and load the new agent as today, logging `Installed hourly agent: com.speedtape.speedtest`.

Keep `prepareDatabasePath()` **before** `writeAgentPlist`. If migrate throws, the old agent stays loaded.

- [ ] **Step 2: Update uninstall-agent.ts**

Unload and delete both `AGENT_LABEL` and `LEGACY_AGENT_LABEL` plists. Never delete SQLite files. Log `Removed hourly agent: com.speedtape.speedtest`.

- [ ] **Step 3: Commit**

```bash
git add scripts/install-agent.ts scripts/uninstall-agent.ts
git commit -m "$(cat <<'EOF'
Cut the hourly agent over to Speedtape and keep the old database copy.

EOF
)"
```

---

### Task 7: Point hrefs and old URLs at `/app`

**Files:**
- Modify: `lib/runs.ts`
- Modify: `lib/runs.test.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write the failing tests**

In `lib/runs.test.ts`:

```ts
expect(homeHref("24h")).toBe("/app");
expect(homeHref("7d")).toBe("/app?range=7d");
expect(runHref({ range: "24h", status: "all", slow: false, ping: false, sort: "newest", page: 1 })).toBe("/app?range=24h");
expect(runHref({ range: "7d", status: "ok", slow: true, ping: true, sort: "highest-ping", page: 2 })).toBe("/app?range=7d&status=ok&slow=1&ping=1&sort=highest-ping&page=2");
expect(archiveHref({ status: "all", slow: false, ping: false, sort: "newest" })).toBe("/app/runs");
expect(archiveHref({ status: "failed", slow: true, ping: true, sort: "oldest" })).toBe("/app/runs?status=failed&slow=1&ping=1&sort=oldest");
expect(runDetailHref(42)).toBe("/app/runs/42");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/runs.test.ts`

Expected: FAIL, still `/` and `/runs`.

- [ ] **Step 3: Write minimal implementation**

```ts
export function runHref(query: RunQuery): string {
  const params = new URLSearchParams();
  params.set("range", query.range);
  if (query.status !== "all") params.set("status", query.status);
  if (query.slow) params.set("slow", "1");
  if (query.ping) params.set("ping", "1");
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return `/app?${params.toString()}`;
}

export function homeHref(range: Range): string {
  return range === "24h" ? "/app" : `/app?range=${range}`;
}

export function archiveHref(query: ArchiveQuery): string {
  const params = new URLSearchParams();
  if (query.status !== "all") params.set("status", query.status);
  if (query.slow) params.set("slow", "1");
  if (query.ping) params.set("ping", "1");
  if (query.sort !== "newest") params.set("sort", query.sort);
  const qs = params.toString();
  return qs ? `/app/runs?${qs}` : "/app/runs";
}

export function runDetailHref(id: number): string {
  return `/app/runs/${id}`;
}
```

In `next.config.ts` add:

```ts
async redirects() {
  return [
    { source: "/runs", destination: "/app/runs", permanent: true },
    { source: "/runs/:id", destination: "/app/runs/:id", permanent: true },
  ];
},
```

Query strings pass through automatically.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/runs.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/runs.ts lib/runs.test.ts next.config.ts
git commit -m "$(cat <<'EOF'
Move meter links to /app and redirect old /runs URLs.

EOF
)"
```

---

### Task 8: Move the dashboard under `/app`

**Files:**
- Create: `app/app/page.tsx` (move from `app/page.tsx`)
- Create: `app/app/runs/page.tsx` (move from `app/runs/page.tsx`)
- Create: `app/app/runs/[id]/page.tsx` (move from `app/runs/[id]/page.tsx`)
- Modify: `app/components/site-nav.tsx`

Keep a temporary `app/page.tsx` that re-exports or still renders the dashboard until Task 10 replaces it with the landing. After the move, `app/page.tsx` should `redirect("/app")` only if you need `/` to keep working during the gap. Prefer: move files, then immediately leave `app/page.tsx` as a stub that `redirect("/app")` so `npm run build` still has a root page. Task 10 replaces that stub.

- [ ] **Step 1: Move the route files**

```bash
mkdir -p app/app/runs/[id]
git mv app/page.tsx app/app/page.tsx
git mv app/runs/page.tsx app/app/runs/page.tsx
git mv app/runs/[id]/page.tsx app/app/runs/[id]/page.tsx
```

If `git mv` of `app/page.tsx` conflicts with needing a root page, copy then write a stub `app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function HomeRedirect() {
  redirect("/app");
}
```

- [ ] **Step 2: Fix typed routes**

In `app/app/page.tsx` change `PageProps<"/">` to `PageProps<"/app">`.

In `app/app/runs/page.tsx` change `PageProps<"/runs">` to `PageProps<"/app/runs">`.

In `app/app/runs/[id]/page.tsx` change `PageProps<"/runs/[id]">` to `PageProps<"/app/runs/[id]">`.

- [ ] **Step 3: Update site nav**

```tsx
export function SiteNav({ current }: { current: "home" | "runs" }) {
  return (
    <nav aria-label="Site" className="flex flex-wrap items-center gap-1">
      <Link href="/" className={`${tab} border-hairline text-muted hover:border-copper hover:text-paper`}>
        Speedtape
      </Link>
      <Link
        href={homeHref("24h")}
        className={`${tab} ${
          current === "home"
            ? "border-copper bg-copper text-ink"
            : "border-hairline text-muted hover:border-copper hover:text-paper"
        }`}
      >
        Dashboard
      </Link>
      <Link
        href={archiveHref({
          status: "all",
          slow: false,
          ping: false,
          sort: "newest",
        })}
        className={`${tab} ${
          current === "runs"
            ? "border-copper bg-copper text-ink"
            : "border-hairline text-muted hover:border-copper hover:text-paper"
        }`}
      >
        Runs
      </Link>
    </nav>
  );
}
```

One intent per label: Speedtape goes to landing, Dashboard to `/app`, Runs to `/app/runs`.

- [ ] **Step 4: Build to confirm routes exist**

Run: `npx next build`

Expected: succeed, routes include `/`, `/app`, `/app/runs`, `/app/runs/[id]`.

If typed `PageProps` fails, fix the generic to match the new path.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/app app/runs app/components/site-nav.tsx
git commit -m "$(cat <<'EOF'
Move the meter to /app so the root can become a landing page.

EOF
)"
```

---

### Task 9: Geist, teal tokens, and Speedtape copy

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/app/page.tsx`
- Modify: `app/app/runs/page.tsx`
- Modify: `app/app/runs/[id]/page.tsx`
- Modify: `app/not-found.tsx`
- Modify: `app/components/speed-tape.tsx` (add `rounded-lg` on the section)

Keep class names `text-copper` / `bg-copper`. Remap the CSS variables to teal so every existing class changes color without a rewrite.

- [ ] **Step 1: Fonts and metadata**

`app/layout.tsx`:

```tsx
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/site";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Hourly internet speed for the house",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Tokens**

Replace `:root` and `@theme` in `app/globals.css` with:

```css
:root {
  --ink: #fafafa;
  --panel: #ffffff;
  --raised: #ffffff;
  --hairline: #e4e4e7;
  --copper: #0f766e;
  --amber: #14b8a6;
  --paper: #18181b;
  --muted: #71717a;
  --up: #0f766e;
  --fail: #b91c1c;
  --background: var(--ink);
  --foreground: var(--paper);
  --radius: 8px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ink: #09090b;
    --panel: #18181b;
    --raised: #18181b;
    --hairline: #27272a;
    --copper: #2dd4bf;
    --amber: #5eead4;
    --paper: #f4f4f5;
    --muted: #a1a1aa;
    --up: #2dd4bf;
    --fail: #f87171;
  }
}

@theme inline {
  --color-ink: var(--ink);
  --color-panel: var(--panel);
  --color-raised: var(--raised);
  --color-hairline: var(--hairline);
  --color-copper: var(--copper);
  --color-amber: var(--amber);
  --color-paper: var(--paper);
  --color-muted: var(--muted);
  --color-up: var(--up);
  --color-fail: var(--fail);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-display: var(--font-geist);
  --font-mono: var(--font-geist-mono);
  --radius-lg: var(--radius);
}
```

Body background: solid `var(--ink)`, drop the copper radial gradient.

Add `rounded-lg` to the speed-tape `<section>` and other `border border-hairline` panels you touch. Buttons already using copper keep `text-ink` so contrast stays (teal button, dark text in light mode; in dark mode `--ink` is near-black and `--copper` is teal, so `text-ink` on `bg-copper` is dark-on-teal. That fails WCAG in dark mode.

Fix button contrast: use `text-white` in dark and `text-white` on teal-700 in light (teal-700 + white passes). Change button text from `text-ink` to `text-white` on `bg-copper` fills: `site-nav` active tab, `run-test-button`, `not-found` primary. Active nav: `border-copper bg-copper text-white`.

- [ ] **Step 3: Copy**

Replace every `House circuit` / `Home line` with Speedtape branding:

Dashboard header (`app/app/page.tsx`): drop the House circuit eyebrow. Title `Speedtape`. Subtitle: `Download, upload, and ping for this network. Hourly samples stay on the Mac even when this page is closed.`

Runs header: drop House circuit. Keep `All runs`.

Run detail: drop House circuit.

`not-found.tsx`: drop House circuit. Title stays `Not found`. Home link still goes to `homeHref("24h")` (dashboard). Add a Speedtape link to `/` only in site nav.

Add `font-semibold` to the main `font-display` titles on those pages.

- [ ] **Step 4: Run tape component test**

Run: `npx vitest run app/components/speed-tape.test.tsx lib/runs.test.ts`

Expected: PASS (`bg-copper` class name remains).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css app/app app/not-found.tsx app/components/speed-tape.tsx app/components/site-nav.tsx app/components/run-test-button.tsx
git commit -m "$(cat <<'EOF'
Restyle Speedtape with Geist, teal, and light and dark tokens.

EOF
)"
```

---

### Task 10: Landing page

**Files:**
- Create: `lib/landing-tape.ts`
- Create: `lib/landing-tape.test.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the failing sample-tape test**

```ts
import { describe, expect, it } from "vitest";
import { landingTapeCells } from "@/lib/landing-tape";

describe("landingTapeCells", () => {
  it("returns 24 hourly sample cells", () => {
    const cells = landingTapeCells();
    expect(cells).toHaveLength(24);
    expect(cells.some((cell) => cell.failed)).toBe(true);
    expect(cells.some((cell) => cell.downloadMbps !== null && !cell.failed)).toBe(
      true,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/landing-tape.test.ts`

Expected: FAIL with `Cannot find module '@/lib/landing-tape'`

- [ ] **Step 3: Sample cells**

```ts
import type { TapeCell } from "@/lib/tape";

const START = Date.parse("2026-08-14T00:00:00.000Z");
const SAMPLE_DOWN = [
  42, 55, 60, 58, 80, 90, 88, 70, 40, 35, 38, 95, 110, 108, 100, 92, 85, 60, 22,
  18, 40, 70, 88, 96,
];

export function landingTapeCells(): TapeCell[] {
  return SAMPLE_DOWN.map((down, i) => {
    const failed = i === 18;
    const hour = i;
    return {
      hourStart: START + i * 60 * 60 * 1000,
      label: String(hour).padStart(2, "0"),
      downloadMbps: failed ? null : down,
      uploadMbps: failed ? null : 12,
      pingMs: failed ? null : 9,
      failed,
    };
  });
}
```

- [ ] **Step 4: Replace `app/page.tsx` with the landing**

Server Component. If `searchParams.range` is a string, `redirect` to `/app` with the same query string (all string params). Do not call `loadDashboard`.

Structure:

1. Nav: wordmark `Speedtape` (text, not a second logo), `View on GitHub` (`GITHUB_URL`, `target="_blank"` `rel="noreferrer"`), `Open dashboard` (`/app`). Height under 80px. `min-h-[100dvh]` on the page wrapper, not `h-screen`.
2. Hero: `h1` `Hourly internet speed for the house.` Subtext: `Clone it, install the hourly agent, watch download, upload, and ping from any device on the LAN.` Primary `Open dashboard`, secondary `View on GitHub`. No eyebrow, no scroll cue, no version label.
3. How it runs. Four command blocks labeled `Install CLI`, `Install dependencies`, `Install agent`, `Start dashboard`:

```
brew tap teamookla/speedtest
brew install speedtest
```

```
npm install
```

```
npm run install-agent
```

```
npm run dev
```

Then one line: open `http://localhost:3000` on this Mac, or the LAN IP from another device.

4. What you get. Short list: local SQLite, hourly launchd agent while the Mac is awake, 24-hour tape, history chart, runs archive. Render `<SpeedTape cells={landingTapeCells()} />` with caption `Sample 24-hour tape.`
5. Footer: `MIT` (`LICENSE_LABEL`), `View on GitHub`, `Open dashboard`.

No em dashes. No en dashes as separators. No House circuit. No Home line. No Inter. Use existing tokens (`bg-ink`, `text-paper`, `border-hairline`, `bg-copper text-white` for primary CTA).

`Open dashboard` is the only dashboard CTA label. `View on GitHub` is the only GitHub CTA label.

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/landing-tape.test.ts app/components/speed-tape.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx lib/landing-tape.ts lib/landing-tape.test.ts
git commit -m "$(cat <<'EOF'
Add a Speedtape landing page at / with a sample tape.

EOF
)"
```

---

### Task 11: MIT license and clone-and-run README

**Files:**
- Create: `LICENSE`
- Modify: `package.json`
- Modify: `package-lock.json` (name field at the top if present)
- Modify: `README.md`

- [ ] **Step 1: LICENSE**

MIT, copyright 2026 Tushar Vagela. Use the standard MIT body (permission, inclusion of copyright, as-is warranty).

- [ ] **Step 2: package.json**

```json
"name": "speedtape",
"license": "MIT",
```

Keep `"private": true`.

- [ ] **Step 3: README.md**

Rewrite as:

# Speedtape

Hourly internet speed for the house. Results stay in SQLite on the Mac. A LaunchAgent runs the same test every hour even when the dashboard is closed.

## What you need

macOS, Node.js 20+, Homebrew, official Ookla Speedtest CLI.

```bash
brew tap teamookla/speedtest
brew install speedtest
```

## Setup

```bash
npm install
npm run install-agent
npm run dev
```

Open http://localhost:3000 for the landing page, then Open dashboard, or go to http://localhost:3000/app. From another device on the same Wi-Fi use `http://<this-mac-lan-ip>:3000`.

## Hourly agent

```bash
npm run install-agent
npm run uninstall-agent
npm run speedtest
```

- Plist: `~/Library/LaunchAgents/com.speedtape.speedtest.plist`
- Logs: `~/Library/Logs/speedtape.out.log` and `.err.log`
- Database: `~/Library/Application Support/speedtape/speedtests.db`

If you already ran the old `home-network-checker` agent, the first dashboard open and `npm run install-agent` copy `speedtests.db` into the Speedtape folder. The old folder stays until you delete it after the history looks right.

Override the database path with `SPEEDTAPE_DB`.

The Mac must be awake for hourly tests.

## License

MIT

Do not add CONTRIBUTING.md. Do not run `gh repo rename`.

- [ ] **Step 4: Commit**

```bash
git add LICENSE package.json package-lock.json README.md
git commit -m "$(cat <<'EOF'
Publish Speedtape as MIT with clone-and-run docs.

EOF
)"
```

---

### Task 12: Verify

- [ ] **Step 1: Unit tests**

Run: `npm test`

Expected: all suites PASS, including migrate, paths, runs hrefs, landing tape, db path.

- [ ] **Step 2: Production build**

Run: `npm run build`

Expected: success. Routes include `/`, `/app`, `/app/runs`, `/app/runs/[id]`. No leftover `House circuit` or `Home line` in `app/` (search to confirm).

- [ ] **Step 3: Grep leftovers**

Run: `rg "House circuit|Home line|HOME_NETWORK_CHECKER_DB|com.home-network-checker" --glob '!docs/**' --glob '!node_modules/**'`

Expected: `com.home-network-checker` only in `lib/paths.ts` (legacy constants), `lib/migrate.ts` comments if any, install/uninstall (legacy unload), and README migration note. No `House circuit` / `Home line` in `app/`.

- [ ] **Step 4: Commit leftover fixes if the grep finds stray copy**

Only if Step 3 found leaks in `app/` or `lib/` beyond the legacy constants.

---

## Self-review

| Spec requirement | Task |
| --- | --- |
| Name Speedtape, MIT, GITHUB_URL | 1, 11 |
| Paths and legacy names | 2 |
| Copy old SQLite before create, WAL, skip dest-exists, skip no-legacy, SPEEDTAPE_DB | 3, 4 |
| Agent label, logs, plist template | 5 |
| install-agent migrate then unload legacy; uninstall both; do not delete db | 6 |
| `/app` hrefs, `/runs` redirects, `/?range=` landing redirect | 7, 8, 10 |
| Move dashboard | 8 |
| Geist, teal, light/dark, 8px, no copper look | 9 |
| Landing sections, sample tape, CTA labels | 10 |
| LICENSE, README, package name | 11 |
| Tests listed in spec | 3, 4, 5, 7, 10, 12 |
| Out of scope (no npm publish, no gh rename, no schema change) | honored |

No TBD. `prepareDatabasePath` / `migrateLegacyDatabase` / `AGENT_LABEL` names match across tasks.
