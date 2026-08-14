import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteNav } from "@/app/components/site-nav";

describe("SiteNav", () => {
  it("includes Config next to Dashboard and Runs", () => {
    const html = renderToStaticMarkup(<SiteNav current="config" />);
    expect(html).toContain("Dashboard");
    expect(html).toContain("Runs");
    expect(html).toContain("Config");
    expect(html).toContain('href="/app/config"');
  });
});
