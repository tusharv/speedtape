import { describe, expect, it } from "vitest";
import { parseRange } from "@/lib/range";

describe("parseRange", () => {
  it("defaults unknown values to 24h", () => {
    expect(parseRange(undefined)).toBe("24h");
    expect(parseRange("nope")).toBe("24h");
    expect(parseRange("7d")).toBe("7d");
  });
});
