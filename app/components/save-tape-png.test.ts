import { describe, expect, it, vi } from "vitest";
import { landingTapeCells } from "@/lib/landing-tape";
import { downloadTapePng } from "@/app/components/save-tape-png";
import { OG_IMAGE, TAPE_CARD, TAPE_PNG_FILENAME } from "@/lib/tape-card";

describe("downloadTapePng", () => {
  it("paints the card and downloads speedtape-24h.png", () => {
    const fills: string[] = [];
    const click = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillStyle: "",
          font: "",
          fillRect() {
            fills.push(String(this.fillStyle));
          },
          fillText() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          closePath() {},
          fill() {},
        };
      },
      toDataURL() {
        return "data:image/png;base64,abc";
      },
    };
    const link = {
      download: "",
      href: "",
      click,
    };

    downloadTapePng(landingTapeCells(), {
      createElement(tag: string) {
        if (tag === "canvas") return canvas as unknown as HTMLCanvasElement;
        if (tag === "a") return link as unknown as HTMLAnchorElement;
        throw new Error(`unexpected tag ${tag}`);
      },
    });

    expect(canvas.width).toBe(OG_IMAGE.width);
    expect(canvas.height).toBe(OG_IMAGE.height);
    expect(fills[0]).toBe(TAPE_CARD.ink);
    expect(fills).toContain(TAPE_CARD.fail);
    expect(link.download).toBe(TAPE_PNG_FILENAME);
    expect(link.href).toBe("data:image/png;base64,abc");
    expect(click).toHaveBeenCalledOnce();
  });
});
