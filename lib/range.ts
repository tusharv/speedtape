import type { Range } from "@/lib/types";

export const RANGES: Range[] = ["24h", "7d", "30d", "all"];

export const RANGE_LABELS: Record<Range, string> = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
  all: "All",
};

export function parseRange(value: string | undefined): Range {
  return RANGES.includes(value as Range) ? (value as Range) : "24h";
}
