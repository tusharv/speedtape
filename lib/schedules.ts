import type Database from "better-sqlite3";
import type { CalendarEntry } from "@/lib/launchd";
import { INTERVAL_PRESETS } from "@/lib/schedule-presets";

export { INTERVAL_PRESETS };

const PRESET_SECONDS = new Set<number>(
  INTERVAL_PRESETS.map((item) => item.seconds),
);

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type IntervalSchedule = {
  kind: "interval";
  intervalSeconds: number;
};

export type ClockSchedule = {
  kind: "clock";
  times: string[];
  weekdays: number[];
};

export type ScheduleInput = { name: string } & (IntervalSchedule | ClockSchedule);

export type ScheduleRow = ScheduleInput & {
  id: number;
  createdAt: string;
};

export type ParseResult =
  | { ok: true; value: ScheduleInput }
  | { ok: false; error: string };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function everyDay(weekdays: number[]): boolean {
  if (weekdays.length !== 7) return false;
  const set = new Set(weekdays);
  return ALL_WEEKDAYS.every((day) => set.has(day));
}

export function expandCalendar(
  times: string[],
  weekdays: number[],
): CalendarEntry[] {
  const parsed = [...times]
    .map(parseClockTime)
    .filter((item): item is { hour: number; minute: number } => item !== null)
    .sort((a, b) => a.hour - b.hour || a.minute - b.minute);
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  if (everyDay(days)) {
    return parsed;
  }
  const entries: CalendarEntry[] = [];
  for (const weekday of days) {
    for (const time of parsed) {
      entries.push({ weekday, hour: time.hour, minute: time.minute });
    }
  }
  return entries;
}

function parseClockTime(
  value: string,
): { hour: number; minute: number } | null {
  if (!TIME_RE.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

export function cadenceLine(
  schedule: IntervalSchedule | ClockSchedule,
): string {
  if (schedule.kind === "interval") {
    const preset = INTERVAL_PRESETS.find(
      (item) => item.seconds === schedule.intervalSeconds,
    );
    return preset ? `every ${preset.label}` : `every ${schedule.intervalSeconds}s`;
  }
  const times = schedule.times.join(", ");
  if (everyDay(schedule.weekdays)) {
    return `${times} · every day`;
  }
  const days = [...schedule.weekdays]
    .sort((a, b) => a - b)
    .map((day) => WEEKDAY_NAMES[day])
    .join(", ");
  return `${times} · ${days}`;
}

export function formatAgentCount(loaded: number): string {
  if (loaded <= 0) return "No agents loaded";
  if (loaded === 1) return "1 agent loaded";
  return `${loaded} agents loaded`;
}

export function parseAgentInput(raw: {
  name?: string;
  kind?: string;
  intervalSeconds?: number;
  times?: string[];
  weekdays?: number[];
}): ParseResult {
  const name = raw.name?.trim() ?? "";
  if (name.length < 1) {
    return { ok: false, error: "Name is required." };
  }
  if (name.length > 40) {
    return { ok: false, error: "Name must be 40 characters or fewer." };
  }
  if (raw.kind === "interval") {
    const seconds = raw.intervalSeconds;
    if (seconds === undefined || !PRESET_SECONDS.has(seconds)) {
      return { ok: false, error: "Pick an interval." };
    }
    return {
      ok: true,
      value: { name, kind: "interval", intervalSeconds: seconds },
    };
  }
  if (raw.kind === "clock") {
    const times = (raw.times ?? []).filter((item) => TIME_RE.test(item));
    if (times.length < 1) {
      return { ok: false, error: "Add at least one clock time." };
    }
    if (times.length > 24) {
      return { ok: false, error: "At most 24 clock times." };
    }
    const weekdays = (raw.weekdays ?? []).filter(
      (day) => Number.isInteger(day) && day >= 0 && day <= 6,
    );
    return {
      ok: true,
      value: {
        name,
        kind: "clock",
        times,
        weekdays: weekdays.length === 0 ? [...ALL_WEEKDAYS] : weekdays,
      },
    };
  }
  return { ok: false, error: "Pick interval or clock times." };
}

type ScheduleDbRow = {
  id: number;
  name: string;
  kind: "interval" | "clock";
  interval_seconds: number | null;
  times_json: string | null;
  weekdays_json: string | null;
  created_at: string;
};

function mapSchedule(row: ScheduleDbRow): ScheduleRow {
  if (row.kind === "interval") {
    return {
      id: row.id,
      name: row.name,
      kind: "interval",
      intervalSeconds: row.interval_seconds ?? 3600,
      createdAt: row.created_at,
    };
  }
  return {
    id: row.id,
    name: row.name,
    kind: "clock",
    times: row.times_json ? (JSON.parse(row.times_json) as string[]) : [],
    weekdays: row.weekdays_json
      ? (JSON.parse(row.weekdays_json) as number[])
      : [...ALL_WEEKDAYS],
    createdAt: row.created_at,
  };
}

export function insertSchedule(
  db: Database.Database,
  input: ScheduleInput,
  now = new Date(),
): ScheduleRow {
  const createdAt = now.toISOString();
  const result = db
    .prepare(
      `INSERT INTO schedules (name, kind, interval_seconds, times_json, weekdays_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name,
      input.kind,
      input.kind === "interval" ? input.intervalSeconds : null,
      input.kind === "clock" ? JSON.stringify(input.times) : null,
      input.kind === "clock" ? JSON.stringify(input.weekdays) : null,
      createdAt,
    );
  const id = Number(result.lastInsertRowid);
  return { ...input, id, createdAt };
}

export function listSchedules(db: Database.Database): ScheduleRow[] {
  const rows = db
    .prepare(`SELECT * FROM schedules ORDER BY id ASC`)
    .all() as ScheduleDbRow[];
  return rows.map(mapSchedule);
}

export function getSchedule(
  db: Database.Database,
  id: number,
): ScheduleRow | null {
  const row = db
    .prepare(`SELECT * FROM schedules WHERE id = ?`)
    .get(id) as ScheduleDbRow | undefined;
  return row ? mapSchedule(row) : null;
}

export function deleteSchedule(db: Database.Database, id: number): void {
  db.prepare(`DELETE FROM schedules WHERE id = ?`).run(id);
}

export function deleteAllSchedules(db: Database.Database): void {
  db.prepare(`DELETE FROM schedules`).run();
}

export function toPlistSchedule(
  row: ScheduleInput,
): import("@/lib/launchd").PlistSchedule {
  if (row.kind === "interval") {
    return { kind: "interval", seconds: row.intervalSeconds };
  }
  return { kind: "clock", entries: expandCalendar(row.times, row.weekdays) };
}
