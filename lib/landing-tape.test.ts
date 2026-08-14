import { describe, expect, it } from "vitest";
import {
  landingHourReadout,
  landingTapeCells,
  tapeIndexFromClientX,
} from "@/lib/landing-tape";

describe("landingTapeCells", () => {
  it("returns 24 hourly sample cells", () => {
    const cells = landingTapeCells();
    expect(cells).toHaveLength(24);
    expect(cells.some((cell) => cell.failed)).toBe(true);
    expect(cells.some((cell) => cell.downloadMbps !== null && !cell.failed)).toBe(
      true,
    );
  });

  it("reads a sample hour in plain language", () => {
    const cells = landingTapeCells();
    expect(landingHourReadout(cells[12]!)).toBe(
      "Noon 12:00  110.0 down  12.0 up  9.0 ping",
    );
    expect(landingHourReadout(cells[18]!)).toBe("Evening 18:00 failed");
  });

  it("maps pointer x to a bar index", () => {
    expect(tapeIndexFromClientX(50, 0, 240, 24)).toBe(5);
    expect(tapeIndexFromClientX(-10, 0, 240, 24)).toBe(0);
    expect(tapeIndexFromClientX(999, 0, 240, 24)).toBe(23);
  });
});
