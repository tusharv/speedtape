import { describe, expect, it } from "vitest";
import { landingTapeCells } from "@/lib/landing-tape";
import {
  OG_IMAGE,
  TAPE_CARD,
  TAPE_PNG_FILENAME,
  paintTapeCard,
  tapeBarFill,
  tapeBarRects,
} from "@/lib/tape-card";
import type { TapeCell } from "@/lib/tape";

function cell(
  label: string,
  downloadMbps: number | null,
  failed = false,
): TapeCell {
  return {
    hourStart: Number(label),
    label,
    downloadMbps,
    uploadMbps: downloadMbps,
    pingMs: downloadMbps === null ? null : 8,
    failed,
  };
}

describe("tape card", () => {
  it("uses the dark zinc card tokens and png names", () => {
    expect(TAPE_CARD.ink).toBe("#09090b");
    expect(TAPE_CARD.teal).toBe("#2dd4bf");
    expect(TAPE_CARD.fail).toBe("#f87171");
    expect(OG_IMAGE.width).toBe(1200);
    expect(OG_IMAGE.height).toBe(630);
    expect(OG_IMAGE.alt).toBe("Speedtape 24 hour sample tape");
    expect(TAPE_PNG_FILENAME).toBe("speedtape-24h.png");
  });

  it("paints fail red, teal, and empty fills", () => {
    expect(tapeBarFill(cell("12", 110))).toBe(TAPE_CARD.teal);
    expect(tapeBarFill(cell("18", null, true))).toBe(TAPE_CARD.fail);
    expect(tapeBarFill(cell("13", null))).toBe(TAPE_CARD.empty);
  });

  it("lays out 24 bottom-aligned bars in the frame", () => {
    const cells = landingTapeCells();
    const frame = { x: 80, y: 280, width: 1040, height: 240 };
    const bars = tapeBarRects(cells, frame);

    expect(bars).toHaveLength(24);
    expect(bars[0]?.x).toBe(frame.x);
    expect(bars[12]?.fill).toBe(TAPE_CARD.teal);
    expect(bars[18]?.fill).toBe(TAPE_CARD.fail);

    const peak = bars[12]!;
    const failed = bars[18]!;
    expect(peak.height).toBeGreaterThan(failed.height);
    expect(failed.height).toBeCloseTo(frame.height * 0.08);
    expect(failed.height / frame.height).toBeLessThan(0.12);
    expect(peak.y + peak.height).toBe(frame.y + frame.height);
    expect(failed.y + failed.height).toBe(frame.y + frame.height);
    expect(bars[23]!.x + bars[23]!.width).toBe(frame.x + frame.width);
  });

  it("paints the ink field then the bars", () => {
    const ops: { fill: string; x: number; y: number; w: number; h: number }[] =
      [];
    const ctx = {
      canvas: { width: OG_IMAGE.width, height: OG_IMAGE.height },
      fillStyle: "",
      fillRect(x: number, y: number, w: number, h: number) {
        ops.push({ fill: String(this.fillStyle), x, y, w, h });
      },
      fillText() {},
      font: "",
      beginPath() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      fill() {},
    };

    paintTapeCard(ctx, landingTapeCells());

    expect(ops[0]).toEqual({
      fill: TAPE_CARD.ink,
      x: 0,
      y: 0,
      w: OG_IMAGE.width,
      h: OG_IMAGE.height,
    });
    expect(ops.some((op) => op.fill === TAPE_CARD.fail)).toBe(true);
    expect(ops.filter((op) => op.fill === TAPE_CARD.teal).length).toBe(23);
  });
});
