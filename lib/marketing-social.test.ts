import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SOCIAL_CARDS,
  SOCIAL_IMAGE,
  SOCIAL_LOCKUP,
} from "@/lib/marketing-social";

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePngRgba(png: Buffer): { width: number; height: number; data: Buffer } {
  const chunks: Buffer[] = [];
  let width = 0;
  let height = 0;
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === "IDAT") {
      chunks.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const out = Buffer.alloc(stride * height);
  let cursor = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[cursor]!;
    const scan = Buffer.from(raw.subarray(cursor + 1, cursor + 1 + stride));
    cursor += 1 + stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? scan[x - 4]! : 0;
      const up = prev[x]!;
      const upLeft = x >= 4 ? prev[x - 4]! : 0;
      if (filter === 1) scan[x] = (scan[x]! + left) & 255;
      else if (filter === 2) scan[x] = (scan[x]! + up) & 255;
      else if (filter === 3) scan[x] = (scan[x]! + ((left + up) >> 1)) & 255;
      else if (filter === 4) scan[x] = (scan[x]! + paeth(left, up, upLeft)) & 255;
    }
    scan.copy(out, y * stride);
    prev = scan;
  }
  return { width, height, data: out };
}

function lockupPixels(png: Buffer): Buffer {
  const image = decodePngRgba(png);
  const { left, top, width, height } = SOCIAL_LOCKUP;
  const slice = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const src = ((top + y) * image.width + left) * 4;
    image.data.copy(slice, y * width * 4, src, src + width * 4);
  }
  return slice;
}

describe("marketing social cards", () => {
  it("names three 1200 by 630 share images", () => {
    expect(SOCIAL_IMAGE).toEqual({ width: 1200, height: 630 });
    expect(SOCIAL_CARDS.map((card) => card.file)).toEqual([
      "speedtape-what-is.png",
      "speedtape-sample-cards.png",
      "speedtape-other-features.png",
    ]);
  });

  it("publishes those three pngs at the share size", () => {
    for (const card of SOCIAL_CARDS) {
      const png = readFileSync(join(process.cwd(), "docs/marketing", card.file));
      expect([...png.subarray(0, 8)]).toEqual([
        137, 80, 78, 71, 13, 10, 26, 10,
      ]);
      expect(png.readUInt32BE(16)).toBe(SOCIAL_IMAGE.width);
      expect(png.readUInt32BE(20)).toBe(SOCIAL_IMAGE.height);
    }
  });

  it("keeps the lockup in the same top-left on every card", () => {
    const slices = SOCIAL_CARDS.map((card) =>
      lockupPixels(readFileSync(join(process.cwd(), "docs/marketing", card.file))),
    );
    expect(slices[1]?.equals(slices[0]!)).toBe(true);
    expect(slices[2]?.equals(slices[0]!)).toBe(true);
  });
});
