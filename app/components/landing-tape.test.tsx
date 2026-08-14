import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LandingTape } from "@/app/components/landing-tape";
import { landingTapeCells } from "@/lib/landing-tape";

describe("LandingTape", () => {
  it("starts on the last sample hour and exposes a slider", () => {
    const html = renderToStaticMarkup(
      <LandingTape cells={landingTapeCells()} />,
    );

    expect(html).toContain('role="slider"');
    expect(html).toContain("Night 23:00");
    expect(html).toContain("96.0 down");
    expect(html).toContain("Late night");
    expect(html).toContain("Evening");
    expect(html).toContain("24h ago");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("touch-pan-y");
    expect(html).not.toContain("24hr History");
  });
});
