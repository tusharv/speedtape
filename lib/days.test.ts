import { describe, expect, it } from "vitest";
import {
  dayEndExclusiveIso,
  dayStartIso,
  orderedDays,
  parseDay,
} from "@/lib/days";

describe("parseDay", () => {
  it("accepts a calendar day and rejects junk", () => {
    expect(parseDay("2026-08-01")).toBe("2026-08-01");
    expect(parseDay(undefined)).toBeNull();
    expect(parseDay("nope")).toBeNull();
    expect(parseDay("2026-13-01")).toBeNull();
    expect(parseDay("2026-02-30")).toBeNull();
  });
});

describe("orderedDays", () => {
  it("swaps inverted start and end days", () => {
    expect(orderedDays("2026-08-10", "2026-08-01")).toEqual({
      from: "2026-08-01",
      to: "2026-08-10",
    });
    expect(orderedDays("2026-08-01", null)).toEqual({
      from: "2026-08-01",
      to: null,
    });
  });
});

describe("day bounds", () => {
  it("covers the local calendar day from midnight to the next midnight", () => {
    expect(dayStartIso("2026-08-01")).toBe(
      new Date(2026, 7, 1).toISOString(),
    );
    expect(dayEndExclusiveIso("2026-08-01")).toBe(
      new Date(2026, 7, 2).toISOString(),
    );
  });
});
