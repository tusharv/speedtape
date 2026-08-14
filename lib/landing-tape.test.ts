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
