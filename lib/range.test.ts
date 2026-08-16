import { describe, expect, it } from "vitest";
import { parseRange } from "@/lib/range";

describe("parseRange", () => {
  it("defaults unknown values to 24h", () => {
    expect(parseRange(undefined)).toBe("24h");
    expect(parseRange("nope")).toBe("24h");
    expect(parseRange("7d")).toBe("7d");
  });

  it("can default unknown values to all for archive", () => {
    expect(parseRange(undefined, "all")).toBe("all");
    expect(parseRange("nope", "all")).toBe("all");
    expect(parseRange("7d", "all")).toBe("7d");
  });
});
