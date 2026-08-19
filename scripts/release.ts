import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { isReleaseCommit, parseGitLog, planRelease } from "../lib/release";

function readOptional(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function latestVersionTag(): string | null {
  try {
    return execFileSync(
      "git",
      ["describe", "--tags", "--abbrev=0", "--match", "v*"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return null;
  }
}

function commitsSince(tag: string | null): string {
  const pretty = "%h%x09%s%x09%b%x00";
  const args = tag
    ? ["log", `${tag}..HEAD`, "--no-merges", `--pretty=format:${pretty}`]
    : ["log", "-1", "--no-merges", `--pretty=format:${pretty}`];
  return execFileSync("git", args, { encoding: "utf8" });
}

function appendOutput(name: string, value: string) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) {
    console.log(`${name}=${value}`);
    return;
  }
  writeFileSync(output, `${name}=${value}\n`, { flag: "a" });
}

function main() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    version: string;
  };
  const commits = parseGitLog(commitsSince(latestVersionTag()));
  const releaseCommits = commits.filter(
    (commit) => !isReleaseCommit(commit.subject),
  );
  if (releaseCommits.length === 0) {
    console.log("No new commits to version.");
    return;
  }

  const planned = planRelease({
    currentVersion: pkg.version,
    date: new Date().toISOString().slice(0, 10),
    changelog: readOptional("CHANGELOG.md") ?? "# Changelog\n",
    commits,
  });

  const apply =
    process.env.GITHUB_ACTIONS === "true" || process.argv.includes("--apply");
  if (!apply) {
    console.log(`Would release ${planned.tag}`);
    console.log(planned.notes);
    appendOutput("version", planned.version);
    appendOutput("tag", planned.tag);
    return;
  }

  writeFileSync("CHANGELOG.md", planned.changelog);
  const notesPath = process.env.RELEASE_NOTES_PATH ?? "RELEASE_NOTES.md";
  writeFileSync(notesPath, `${planned.notes}\n`);
  appendOutput("version", planned.version);
  appendOutput("tag", planned.tag);
  appendOutput("notes_path", notesPath);
}

main();
