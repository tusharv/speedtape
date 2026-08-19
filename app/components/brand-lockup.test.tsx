import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandLockup, BrandMark } from "@/app/components/brand-lockup";

describe("BrandLockup", () => {
  it("links the readable Speedtape name home and hides the mark", () => {
    const html = renderToStaticMarkup(<BrandLockup />);

    expect(html).toContain('href="/"');
    expect(html).toContain('aria-label="Speedtape home"');
    expect(html).toContain("<span>Speedtape</span>");
    expect(html).toMatch(
      /<(?:svg|span)(?=[^>]*data-brand-mark="true")(?=[^>]*aria-hidden="true")[^>]*>/,
    );
    expect(html).toContain("<svg");
    expect(html).toContain("<polygon");
    expect(html).not.toContain("border-copper/40");
    expect(html).not.toContain("data-brand-bars");
    expect(html).not.toContain("inset-[20%]");
  });

  it("supports compact and prominent signal mark sizes", () => {
    const html = renderToStaticMarkup(
      <>
        <BrandMark size="sm" />
        <BrandMark size="lg" />
      </>,
    );

    expect(html).toMatch(/data-brand-mark="true"[^>]*class="[^"]*h-5/);
    expect(html).toMatch(/data-brand-mark="true"[^>]*class="[^"]*h-12/);
    expect(html).not.toMatch(/data-brand-mark="true"[^>]*class="[^"]*size-7/);
  });

  it("uses a custom accessible label for non-home links", () => {
    const html = renderToStaticMarkup(
      <BrandLockup href="/app" ariaLabel="Speedtape dashboard" />,
    );

    expect(html).toContain('href="/app"');
    expect(html).toContain('aria-label="Speedtape dashboard"');
  });
});
