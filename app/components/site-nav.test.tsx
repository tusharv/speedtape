import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteHeader, SiteNav } from "@/app/components/site-nav";

describe("SiteNav", () => {
  it("includes icon tabs for Dashboard, Runs, and Config", () => {
    const html = renderToStaticMarkup(<SiteNav current="config" />);
    expect(html).toContain("Dashboard");
    expect(html).toContain("Runs");
    expect(html).toContain("Config");
    expect(html).toContain('href="/app/config"');
    expect(html).toContain('aria-current="page"');
    expect((html.match(/<svg/g) ?? []).length).toBe(3);
  });
});

describe("SiteHeader", () => {
  it("uses the brand lockup and the same chrome as the landing bar", () => {
    const html = renderToStaticMarkup(<SiteHeader current="home" />);
    expect(html).toContain('aria-label="Speedtape home"');
    expect(html).toContain("Dashboard");
    expect(html).toContain("min-h-16");
    expect(html).toContain("border-b border-hairline py-4");
    expect(html).not.toContain(">Speedtape</a>");
  });
});
