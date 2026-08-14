import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandLockup } from "@/app/components/brand-lockup";

describe("BrandLockup", () => {
  it("links the readable Speedtape name home and hides the mark", () => {
    const html = renderToStaticMarkup(<BrandLockup />);

    expect(html).toContain('href="/"');
    expect(html).toContain('aria-label="Speedtape home"');
    expect(html).toContain("Speedtape");
    expect(html).toContain('data-brand-mark="true"');
    expect(html).toContain('aria-hidden="true"');
  });
});
