import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { landingTapeCells } from "../lib/landing-tape";
import {
  BRAND_MARK_VIEWBOX,
  brandMarkPointsAttr,
  brandMarkPolygons,
} from "../lib/brand-mark";
import {
  OG_IMAGE,
  TAPE_CARD,
  tapeBarRects,
  tapeCardBarFrame,
} from "../lib/tape-card";

async function render(): Promise<void> {
  const cells = landingTapeCells();
  const frame = tapeCardBarFrame();
  const bars = tapeBarRects(cells, frame);

  const response = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: OG_IMAGE.width,
          height: OG_IMAGE.height,
          background: TAPE_CARD.ink,
          color: TAPE_CARD.paper,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            position: "absolute",
            left: frame.x,
            top: 60,
            color: TAPE_CARD.paper,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: -0.5,
          }}
        >
          <svg
            width={Math.round((BRAND_MARK_VIEWBOX.width / BRAND_MARK_VIEWBOX.height) * 28)}
            height={28}
            viewBox={`0 0 ${BRAND_MARK_VIEWBOX.width} ${BRAND_MARK_VIEWBOX.height}`}
          >
            {brandMarkPolygons().map((points) => (
              <polygon
                key={brandMarkPointsAttr(points)}
                points={brandMarkPointsAttr(points)}
                fill={TAPE_CARD.teal}
              />
            ))}
          </svg>
          Speedtape
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: frame.x,
            top: 132,
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 0.96,
          }}
        >
          Know your line.
        </div>
        {bars.map((bar) => (
          <div
            key={`${bar.x}-${bar.y}`}
            style={{
              display: "flex",
              position: "absolute",
              left: bar.x,
              top: bar.y,
              width: bar.width,
              height: bar.height,
              background: bar.fill,
            }}
          />
        ))}
      </div>
    ),
    {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
    },
  );

  const png = Buffer.from(await response.arrayBuffer());
  const root = process.cwd();
  writeFileSync(join(root, "docs", "og.png"), png);
  writeFileSync(join(root, "app", "opengraph-image.png"), png);
}

void render();
