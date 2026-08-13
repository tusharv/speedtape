import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpeedTape } from "@/app/components/speed-tape";
import type { TapeCell } from "@/lib/tape";

function cell(
  hourStart: number,
  label: string,
  downloadMbps: number | null,
): TapeCell {
  return { hourStart, label, downloadMbps, failed: false };
}

const noonCells: TapeCell[] = [cell(0, "12", 80), cell(1, "13", null)];

describe("SpeedTape", () => {
  it("stretches hour cells to the track height so percentage bars can paint", () => {
    const html = renderToStaticMarkup(<SpeedTape cells={noonCells} />);

    expect(html).toContain("flex h-28 items-stretch gap-px");
    expect(html).toContain(
      "group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end",
    );
  });

  it("labels the axis with day parts instead of three hour numbers", () => {
    const hours = Array.from({ length: 24 }, (_, hour) =>
      cell(hour, String(hour).padStart(2, "0"), hour === 12 ? 40 : null),
    );
    const html = renderToStaticMarkup(<SpeedTape cells={hours} />);

    expect(html).toContain("Late night");
    expect(html).toContain("Morning");
    expect(html).toContain("Noon");
    expect(html).toContain("Evening");
    expect(html).toContain("Night");
    expect(html).toContain('title="12: 40.0 Mbps"');
    expect(html).not.toMatch(/>01<\/span><span>12<\/span><span>00</);
  });
});
