export type BumpKind = "major" | "minor" | "patch";

export type Commit = {
  hash: string;
  subject: string;
  body?: string;
};

export type ReleasePlan = {
  version: string;
  tag: string;
  notes: string;
  changelog: string;
};

const RELEASE_SUBJECT = /^chore\(release\):/;
const TYPE_PREFIX = /^([a-z]+)(?:\([^)]+\))?(!)?:/i;
const BUMP_RANK: Record<BumpKind, number> = {
  patch: 0,
  minor: 1,
  major: 2,
};

export function isReleaseCommit(subject: string): boolean {
  return RELEASE_SUBJECT.test(subject.trim());
}

function commitType(subject: string): string | null {
  const match = TYPE_PREFIX.exec(subject.trim());
  return match?.[1]?.toLowerCase() ?? null;
}

function isBreaking(commit: Commit): boolean {
  const subject = commit.subject.trim();
  const body = commit.body ?? "";
  return subject.includes("!:") || /BREAKING CHANGE:/.test(`${subject}\n${body}`);
}

function bumpKindForCommit(commit: Commit): BumpKind {
  if (isBreaking(commit)) return "major";
  if (commitType(commit.subject) === "feat") return "minor";
  return "patch";
}

export function bumpKindForCommits(commits: Commit[]): BumpKind {
  return commits
    .filter((commit) => !isReleaseCommit(commit.subject))
    .reduce<BumpKind>((strongest, commit) => {
      const kind = bumpKindForCommit(commit);
      return BUMP_RANK[kind] > BUMP_RANK[strongest] ? kind : strongest;
    }, "patch");
}

export function nextVersion(current: string, bump: BumpKind): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) {
    throw new Error(`Invalid version: ${current}`);
  }
  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);
  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function parseRecord(record: string): Commit | null {
  const trimmed = record.replace(/^\s+/, "").replace(/\s+$/, "");
  if (!trimmed) return null;
  const [hash, subject, ...bodyParts] = trimmed.split("\t");
  if (!hash || !subject) return null;
  const body = bodyParts.join("\t").trim();
  return body ? { hash, subject, body } : { hash, subject };
}

export function parseGitLog(text: string): Commit[] {
  const records = text.includes("\0") ? text.split("\0") : text.split(/\r?\n/);
  return records.flatMap((record) => {
    const commit = parseRecord(record);
    return commit ? [commit] : [];
  });
}

function displaySubject(subject: string): string {
  return subject.trim().replace(TYPE_PREFIX, "").trim();
}

export function formatReleaseNotes(commits: Commit[]): string {
  const features: string[] = [];
  const fixes: string[] = [];
  const other: string[] = [];
  for (const commit of commits) {
    if (isReleaseCommit(commit.subject)) continue;
    const line = `- ${displaySubject(commit.subject)} (${commit.hash})`;
    const type = commitType(commit.subject);
    if (type === "feat") features.push(line);
    else if (type === "fix") fixes.push(line);
    else other.push(line);
  }
  const sections: string[] = [];
  if (features.length) {
    sections.push(["### Features", "", ...features].join("\n"));
  }
  if (fixes.length) {
    sections.push(["### Fixes", "", ...fixes].join("\n"));
  }
  if (other.length) {
    sections.push(["### Other", "", ...other].join("\n"));
  }
  return sections.join("\n\n");
}

export function prependChangelog(existing: string, section: string): string {
  const heading = "# Changelog";
  const body = section.trimEnd();
  const match = existing.match(/^# Changelog\n(?:\n)?/);
  if (!match) {
    const rest = existing.trimEnd();
    return rest
      ? `${heading}\n\n${body}\n\n${rest}\n`
      : `${heading}\n\n${body}\n`;
  }
  const afterHeading = existing.slice(match[0].length);
  const versionAt = afterHeading.search(/^## /m);
  if (versionAt < 0) {
    const intro = afterHeading.trimEnd();
    return intro
      ? `${heading}\n\n${intro}\n\n${body}\n`
      : `${heading}\n\n${body}\n`;
  }
  const intro = afterHeading.slice(0, versionAt).trimEnd();
  const versions = afterHeading.slice(versionAt).trimEnd();
  const prefix = intro ? `${heading}\n\n${intro}\n\n` : `${heading}\n\n`;
  return `${prefix}${body}\n\n${versions}\n`;
}

export function planRelease(input: {
  currentVersion: string;
  date: string;
  changelog: string;
  commits: Commit[];
}): ReleasePlan {
  const version = nextVersion(
    input.currentVersion,
    bumpKindForCommits(input.commits),
  );
  const notes = formatReleaseNotes(input.commits);
  const section = `## ${version} - ${input.date}\n\n${notes}\n`;
  return {
    version,
    tag: `v${version}`,
    notes,
    changelog: prependChangelog(input.changelog, section),
  };
}
