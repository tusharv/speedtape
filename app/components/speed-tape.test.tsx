import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpeedTape } from "@/app/components/speed-tape";
import type { TapeCell } from "@/lib/tape";

function cell(
  hourStart: number,
  label: string,
  downloadMbps: number | null,
  failed = false,
): TapeCell {
  return {
    hourStart,
    label,
    downloadMbps,
    uploadMbps: downloadMbps === null ? null : 10,
    pingMs: downloadMbps === null ? null : 8,
    failed,
  };
}

const noonCells: TapeCell[] = [cell(0, "12", 80), cell(1, "13", null)];

describe("SpeedTape", () => {
  it("shows day-part weather headlines over hour bars, not a line graph", () => {
    const html = renderToStaticMarkup(<SpeedTape cells={noonCells} />);

    expect(html).toContain("24hr History");
    expect(html).toContain("Avg download");
    expect(html).toContain("one bar per hour");
    expect(html).toContain("Noon");
    expect(html).toContain("80.0");
    expect(html).toContain('title="12: 80.0 Mbps"');
    expect(html).toContain('title="13: no reading"');
    expect(html).toContain("24h ago");
    expect(html).toContain("now");
    expect(html).not.toContain("recharts");
    expect(html).not.toContain("Download, upload, and ping");
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
    expect(html).toContain("40.0");
    expect(html).not.toMatch(/>01<\/span><span>12<\/span><span>00</);
  });

  it("keeps a one-hour last group headline inside the tape", () => {
    const hours = Array.from({ length: 24 }, (_, index) => {
      const hour = (16 - 24 + index + 24) % 24;
      return cell(index, String(hour).padStart(2, "0"), 106.9);
    });
    const html = renderToStaticMarkup(<SpeedTape cells={hours} />);

    expect(html).toContain("@container");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("cqw");
    expect(html).not.toContain(
      'ml-1 font-mono text-[10px] tracking-normal text-muted',
    );
  });

  it("paints failed hours in fail color and the current hour in amber", () => {
    const html = renderToStaticMarkup(
      <SpeedTape
        cells={[cell(0, "11", 50), cell(1, "12", null, true), cell(2, "13", 80)]}
      />,
    );

    expect(html).toContain('title="12: failed"');
    expect(html).toContain("bg-fail");
    expect(html).toContain("bg-amber");
    expect(html).toContain("bg-copper");
  });

  it("offers Save PNG when the tape has bars", () => {
    const html = renderToStaticMarkup(<SpeedTape cells={noonCells} />);
    expect(html).toContain("Save PNG");
  });

  it("hides Save PNG when there are no bars", () => {
    const html = renderToStaticMarkup(<SpeedTape cells={[]} />);
    expect(html).toContain("24hr History");
    expect(html).not.toContain("Save PNG");
  });
});
