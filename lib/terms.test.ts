import { describe, expect, it } from "vitest";
import { TERMS, termText, type TermKey } from "@/lib/terms";

const KEYS: TermKey[] = [
  "download",
  "upload",
  "ping",
  "jitter",
  "loss",
  "mbps",
  "ms",
  "isp",
  "server",
  "ok",
  "failed",
  "slowDown",
  "highPing",
  "minAvgMax",
  "range24h",
  "range7d",
  "range30d",
  "rangeAll",
  "agent",
  "run",
  "wentDown",
  "restored",
  "outage",
];

describe("termText", () => {
  it("explains every dashboard term in plain language", () => {
    expect(Object.keys(TERMS).sort()).toEqual([...KEYS].sort());
    for (const key of KEYS) {
      const text = termText(key);
      expect(text.length).toBeGreaterThan(24);
      expect(text.includes("—")).toBe(false);
      expect(text.endsWith(".")).toBe(true);
    }
  });

  it("explains jitter as ping that jumps around", () => {
    const text = termText("jitter").toLowerCase();
    expect(text).toContain("jump");
    expect(text).toContain("stutter");
  });

  it("explains loss as data that never arrived", () => {
    const text = termText("loss").toLowerCase();
    expect(text).toContain("never arrived");
  });
});
