import {
  BRAND_MARK_VIEWBOX,
  brandMarkPolygons,
} from "@/lib/brand-mark";
import { tapeBarHeightPct, tapeBarMax, type TapeCell } from "@/lib/tape";

export const TAPE_CARD = {
  ink: "#09090b",
  teal: "#2dd4bf",
  fail: "#f87171",
  empty: "#27272a",
  muted: "#a1a1aa",
  paper: "#f4f4f5",
} as const;

export const OG_IMAGE = {
  width: 1200,
  height: 630,
  alt: "Speedtape 24 hour sample tape",
} as const;

export const TAPE_PNG_FILENAME = "speedtape-24h.png";

export type TapeBarRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type TapeCardFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function tapeCardBarFrame(
  width = OG_IMAGE.width,
  height = OG_IMAGE.height,
): TapeCardFrame {
  const pad = Math.round(width * (80 / OG_IMAGE.width));
  return {
    x: pad,
    y: Math.round(height * (280 / OG_IMAGE.height)),
    width: width - pad * 2,
    height: Math.round(height * (240 / OG_IMAGE.height)),
  };
}

export function tapeBarFill(cell: TapeCell): string {
  if (cell.failed) return TAPE_CARD.fail;
  if (cell.downloadMbps === null) return TAPE_CARD.empty;
  return TAPE_CARD.teal;
}

export function tapeBarRects(
  cells: TapeCell[],
  frame: TapeCardFrame,
): TapeBarRect[] {
  if (cells.length === 0) return [];
  const gap = 2;
  const barWidth = (frame.width - gap * (cells.length - 1)) / cells.length;
  const max = tapeBarMax(cells);
  return cells.map((cell, index) => {
    const x = frame.x + index * (barWidth + gap);
    const width =
      index === cells.length - 1 ? frame.x + frame.width - x : barWidth;
    const height = (tapeBarHeightPct(cell, max) / 100) * frame.height;
    return {
      x,
      y: frame.y + frame.height - height,
      width,
      height,
      fill: tapeBarFill(cell),
    };
  });
}

export type TapeCardPainter = {
  fillStyle: string;
  font: string;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  fillText: (text: string, x: number, y: number) => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  closePath: () => void;
  fill: () => void;
};

function paintBrandMark(
  ctx: TapeCardPainter,
  x: number,
  y: number,
  height: number,
): number {
  const scale = height / BRAND_MARK_VIEWBOX.height;
  ctx.fillStyle = TAPE_CARD.teal;
  for (const polygon of brandMarkPolygons()) {
    const points = polygon.map((point) => ({
      x: x + point.x * scale,
      y: y + point.y * scale,
    }));
    const first = points[0];
    if (!first) continue;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.closePath();
    ctx.fill();
  }
  return BRAND_MARK_VIEWBOX.width * scale;
}

export function paintTapeCard(
  ctx: TapeCardPainter,
  cells: TapeCell[],
  size: { width: number; height: number } = OG_IMAGE,
): void {
  const frame = tapeCardBarFrame(size.width, size.height);
  const scale = size.width / OG_IMAGE.width;
  const markHeight = Math.round(28 * scale);
  const markY = Math.round(60 * scale);

  ctx.fillStyle = TAPE_CARD.ink;
  ctx.fillRect(0, 0, size.width, size.height);

  const markWidth = paintBrandMark(ctx, frame.x, markY, markHeight);

  ctx.fillStyle = TAPE_CARD.paper;
  ctx.font = `600 ${markHeight}px sans-serif`;
  ctx.fillText(
    "Speedtape",
    frame.x + markWidth + Math.round(10 * scale),
    markY + markHeight * 0.82,
  );

  ctx.fillStyle = TAPE_CARD.paper;
  ctx.font = `600 ${Math.round(72 * scale)}px sans-serif`;
  ctx.fillText("Know your line.", frame.x, Math.round(180 * scale));

  for (const bar of tapeBarRects(cells, frame)) {
    ctx.fillStyle = bar.fill;
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
  }
}
