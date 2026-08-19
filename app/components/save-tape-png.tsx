"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react/ssr";
import { ghostBtn } from "@/app/components/chrome";
import {
  OG_IMAGE,
  TAPE_PNG_FILENAME,
  paintTapeCard,
  type TapeCardPainter,
} from "@/lib/tape-card";
import type { TapeCell } from "@/lib/tape";

const icon = { size: 15, weight: "regular" as const, "aria-hidden": true };

export type TapePngHost = {
  createElement: (tagName: string) => HTMLElement;
};

export function downloadTapePng(
  cells: TapeCell[],
  host: TapePngHost = document,
): void {
  const canvas = host.createElement("canvas") as HTMLCanvasElement;
  canvas.width = OG_IMAGE.width;
  canvas.height = OG_IMAGE.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  paintTapeCard(ctx as unknown as TapeCardPainter, cells);
  const link = host.createElement("a") as HTMLAnchorElement;
  link.download = TAPE_PNG_FILENAME;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function SaveTapePng({ cells }: { cells: TapeCell[] }) {
  if (cells.length === 0) return null;

  return (
    <button
      type="button"
      className={ghostBtn}
      onClick={() => downloadTapePng(cells)}
    >
      <DownloadSimpleIcon {...icon} />
      Save PNG
    </button>
  );
}
