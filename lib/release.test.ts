import { describe, expect, it } from "vitest";
import {
  bumpKindForCommits,
  isReleaseCommit,
  nextVersion,
  parseGitLog,
  planRelease,
  prependChangelog,
} from "@/lib/release";

describe("isReleaseCommit", () => {
  it("detects automated version commits so the workflow can skip them", () => {
    expect(isReleaseCommit("chore(release): 0.1.1")).toBe(true);
    expect(isReleaseCommit("feat: isp filter")).toBe(false);
  });
});

describe("bumpKindForCommits", () => {
  it("treats every non-release commit as at least a patch bump", () => {
    expect(
      bumpKindForCommits([{ hash: "abc1234", subject: "docs: note the agent" }]),
    ).toBe("patch");
    expect(
      bumpKindForCommits([{ hash: "abc1234", subject: "fix: duplicate artifact" }]),
    ).toBe("patch");
  });

  it("bumps minor for features and major for breaking changes", () => {
    expect(
      bumpKindForCommits([{ hash: "abc1234", subject: "feat: isp filter" }]),
    ).toBe("minor");
    expect(
      bumpKindForCommits([
        { hash: "abc1234", subject: "feat!: drop sqlite v1 files" },
      ]),
    ).toBe("major");
    expect(
      bumpKindForCommits([
        {
          hash: "abc1234",
          subject: "fix: rename tape export",
          body: "BREAKING CHANGE: the CSV header changed",
        },
      ]),
    ).toBe("major");
  });

  it("uses the strongest bump when a push has mixed commits", () => {
    expect(
      bumpKindForCommits([
        { hash: "aaa1111", subject: "docs: note the agent" },
        { hash: "bbb2222", subject: "feat: isp filter" },
        { hash: "ccc3333", subject: "fix: duplicate artifact" },
      ]),
    ).toBe("minor");
  });
});

describe("nextVersion", () => {
  it("increments semver from the current package version", () => {
    expect(nextVersion("0.1.0", "patch")).toBe("0.1.1");
    expect(nextVersion("0.1.9", "minor")).toBe("0.2.0");
    expect(nextVersion("0.9.4", "major")).toBe("1.0.0");
  });
});

describe("parseGitLog", () => {
  it("reads hash, subject, and optional body from git log records", () => {
    expect(
      parseGitLog(
        "ca67ed7\tfeat: images for social\n\n" +
          "25efed3\tfix: rename tape export\tBREAKING CHANGE: the CSV header changed\n",
      ),
    ).toEqual([
      { hash: "ca67ed7", subject: "feat: images for social" },
      {
        hash: "25efed3",
        subject: "fix: rename tape export",
        body: "BREAKING CHANGE: the CSV header changed",
      },
    ]);
  });

  it("keeps git body text that spans lines when records are NUL delimited", () => {
    expect(
      parseGitLog(
        "25efed3\tfix: rename tape export\tBREAKING CHANGE: the CSV header changed\nmore detail\0",
      ),
    ).toEqual([
      {
        hash: "25efed3",
        subject: "fix: rename tape export",
        body: "BREAKING CHANGE: the CSV header changed\nmore detail",
      },
    ]);
  });
});

describe("planRelease", () => {
  it("builds the next version, tag, notes, and full changelog", () => {
    const planned = planRelease({
      currentVersion: "0.1.0",
      date: "2026-08-19",
      changelog: "# Changelog\n\n## 0.1.0\n\nInitial public version.\n",
      commits: [
        { hash: "ca67ed7", subject: "feat: images for social" },
        { hash: "25efed3", subject: "fix: code re-factor" },
      ],
    });

    expect(planned.version).toBe("0.2.0");
    expect(planned.tag).toBe("v0.2.0");
    expect(planned.notes).toBe(
      [
        "### Features",
        "",
        "- images for social (ca67ed7)",
        "",
        "### Fixes",
        "",
        "- code re-factor (25efed3)",
      ].join("\n"),
    );
    expect(planned.changelog).toBe(
      [
        "# Changelog",
        "",
        "## 0.2.0 - 2026-08-19",
        "",
        "### Features",
        "",
        "- images for social (ca67ed7)",
        "",
        "### Fixes",
        "",
        "- code re-factor (25efed3)",
        "",
        "## 0.1.0",
        "",
        "Initial public version.",
        "",
      ].join("\n"),
    );
  });

  it("keeps a patch log of chores and skips nested release commits", () => {
    const planned = planRelease({
      currentVersion: "0.1.1",
      date: "2026-08-20",
      changelog: "# Changelog\n\n## 0.1.1 - 2026-08-19\n\n- prior\n",
      commits: [
        { hash: "aaa1111", subject: "chore(release): 0.1.1" },
        { hash: "bbb2222", subject: "chore: ignore local worktrees" },
      ],
    });

    expect(planned.version).toBe("0.1.2");
    expect(planned.notes).toContain("### Other");
    expect(planned.notes).toContain("ignore local worktrees (bbb2222)");
    expect(planned.notes).not.toContain("chore(release)");
  });
});

describe("prependChangelog", () => {
  it("inserts a version section under the heading", () => {
    expect(
      prependChangelog(
        "# Changelog\n\n## 0.1.0\n\nInitial public version.\n",
        "## 0.1.1 - 2026-08-19\n\n- docs: note the agent (abc1234)\n",
      ),
    ).toBe(
      "# Changelog\n\n## 0.1.1 - 2026-08-19\n\n- docs: note the agent (abc1234)\n\n## 0.1.0\n\nInitial public version.\n",
    );
  });

  it("keeps the intro blurb above version history", () => {
    expect(
      prependChangelog(
        "# Changelog\n\nAll notable changes to Speedtape are listed here.\n\n## 0.1.0\n\nInitial public version.\n",
        "## 0.1.1 - 2026-08-19\n\n- docs: note the agent (abc1234)\n",
      ),
    ).toBe(
      "# Changelog\n\nAll notable changes to Speedtape are listed here.\n\n## 0.1.1 - 2026-08-19\n\n- docs: note the agent (abc1234)\n\n## 0.1.0\n\nInitial public version.\n",
    );
  });
});
