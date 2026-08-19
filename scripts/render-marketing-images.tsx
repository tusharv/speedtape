import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import {
  BRAND_MARK_VIEWBOX,
  brandMarkPointsAttr,
  brandMarkPolygons,
} from "../lib/brand-mark";
import { landingSampleRuns, landingTapeCells } from "../lib/landing-tape";
import { SOCIAL_CARDS, SOCIAL_IMAGE, SOCIAL_LOCKUP } from "../lib/marketing-social";
import {
  TAPE_CARD,
  tapeBarRects,
  tapeCardBarFrame,
} from "../lib/tape-card";

const PANEL = "#18181b";
const HAIRLINE = "#27272a";

const TITLE_TOP = 108;

function Lockup() {
  const height = 28;
  const width = Math.round(
    (BRAND_MARK_VIEWBOX.width / BRAND_MARK_VIEWBOX.height) * height,
  );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: TAPE_CARD.paper,
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: -0.5,
      }}
    >
      <svg
        width={width}
        height={height}
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
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: SOCIAL_IMAGE.width,
        height: SOCIAL_IMAGE.height,
        background: TAPE_CARD.ink,
        color: TAPE_CARD.paper,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: SOCIAL_LOCKUP.left,
          top: SOCIAL_LOCKUP.top,
        }}
      >
        <Lockup />
      </div>
      {children}
    </div>
  );
}

function WhatIsSpeedtape() {
  const frame = tapeCardBarFrame();
  const bars = tapeBarRects(landingTapeCells(), {
    ...frame,
    y: 360,
    height: 190,
  });

  return (
    <Frame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: SOCIAL_LOCKUP.left,
          top: TITLE_TOP,
          width: 1040,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: -2.4,
            lineHeight: 0.96,
          }}
        >
          What is Speedtape.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            maxWidth: 760,
            color: TAPE_CARD.muted,
            fontSize: 26,
            lineHeight: 1.35,
          }}
        >
          A local house record of download, upload, and ping. Collectors keep
          testing after you close the dashboard.
        </div>
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
    </Frame>
  );
}

function SampleCard({
  accent,
  badge,
  when,
  run,
  down,
  up,
  ping,
  note,
}: {
  accent: string;
  badge: string;
  when: string;
  run: string;
  down: string;
  up: string;
  ping: string;
  note: string;
}) {
  const metric = (label: string, value: string, unit: string, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div
        style={{
          display: "flex",
          color: TAPE_CARD.muted,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginTop: 8,
          color,
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: -1,
        }}
      >
        {value}
        <span
          style={{
            color: TAPE_CARD.muted,
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: 0,
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: PANEL,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 8,
        padding: "28px 28px 22px 32px",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 4,
          background: accent,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            color: TAPE_CARD.muted,
            fontSize: 16,
          }}
        >
          {when}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              display: "flex",
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 8,
              color: TAPE_CARD.teal,
              fontFamily: "monospace",
              fontSize: 13,
              padding: "4px 8px",
            }}
          >
            {run}
          </div>
          <div
            style={{
              display: "flex",
              border: `1px solid ${accent}66`,
              borderRadius: 8,
              color: accent,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 1.4,
              padding: "4px 8px",
              textTransform: "uppercase",
            }}
          >
            {badge}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
        {metric("Down", down, "Mbps", TAPE_CARD.paper)}
        {metric("Up", up, "Mbps", TAPE_CARD.paper)}
        {metric("Ping", ping, "ms", TAPE_CARD.paper)}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 20,
          paddingTop: 16,
          borderTop: `1px solid ${HAIRLINE}`,
          color: note.startsWith("Cannot") ? TAPE_CARD.fail : TAPE_CARD.muted,
          fontSize: 16,
        }}
      >
        {note}
      </div>
    </div>
  );
}

function SampleCards() {
  const { ok, failed } = landingSampleRuns();

  return (
    <Frame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: SOCIAL_LOCKUP.left,
          top: TITLE_TOP,
          width: 1040,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: -2.2,
            lineHeight: 0.96,
          }}
        >
          Sample cards.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            color: TAPE_CARD.muted,
            fontSize: 22,
            lineHeight: 1.35,
          }}
        >
          Each run is a stub. Open one for the full reading, or the outage.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 20,
          position: "absolute",
          left: SOCIAL_LOCKUP.left,
          top: 250,
          width: 1040,
        }}
      >
        <SampleCard
          accent={TAPE_CARD.teal}
          badge="Ok"
          when="Noon"
          run={`#${ok.id}`}
          down={(ok.downloadMbps ?? 0).toFixed(1)}
          up={(ok.uploadMbps ?? 0).toFixed(1)}
          ping={(ok.pingMs ?? 0).toFixed(1)}
          note="Home ISP · Local server"
        />
        <SampleCard
          accent={TAPE_CARD.fail}
          badge="Failed"
          when="Evening"
          run={`#${failed.id}`}
          down="—"
          up="—"
          ping="—"
          note="Cannot open socket"
        />
      </div>
    </Frame>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 500,
        paddingTop: 18,
        borderTop: `1px solid ${HAIRLINE}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: -0.6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 8,
          color: TAPE_CARD.muted,
          fontSize: 20,
          lineHeight: 1.35,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function OtherFeatures() {
  return (
    <Frame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: SOCIAL_LOCKUP.left,
          top: TITLE_TOP,
          width: 1040,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: -2.2,
            lineHeight: 0.96,
          }}
        >
          Other features.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            color: TAPE_CARD.muted,
            fontSize: 22,
            lineHeight: 1.35,
          }}
        >
          The tape is the dashboard. The collectors are the record.
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 28,
            marginTop: 36,
            width: 1040,
          }}
        >
          <Feature
            title="Peak and off-peak"
            body="Collectors fire on an interval or at clock times, including hours you sleep."
          />
          <Feature
            title="CSV for your ISP"
            body="Export the house record as a spreadsheet you can attach to a ticket."
          />
          <Feature
            title="Failed runs stay"
            body="Gaps stay on the tape. Open one to see when the line went down."
          />
          <Feature
            title="This computer only"
            body="Samples never leave this house. Phones on the same Wi-Fi can still watch."
          />
        </div>
      </div>
    </Frame>
  );
}

async function renderPng(node: ReactElement, file: string): Promise<void> {
  const response = new ImageResponse(node, {
    width: SOCIAL_IMAGE.width,
    height: SOCIAL_IMAGE.height,
  });
  const png = Buffer.from(await response.arrayBuffer());
  writeFileSync(join(process.cwd(), "docs/marketing", file), png);
}

async function render(): Promise<void> {
  const [what, sample, features] = SOCIAL_CARDS;
  await renderPng(<WhatIsSpeedtape />, what.file);
  await renderPng(<SampleCards />, sample.file);
  await renderPng(<OtherFeatures />, features.file);
}

void render();
