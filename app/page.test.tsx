import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "@/app/page";

describe("Speedtape landing page", () => {
  it("renders the approved Signal Ledger identity and structure", async () => {
    const page = await Landing({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Know your line.");
    expect(html).toContain("Local network monitor");
    expect(html).toContain('aria-label="24 hour signal"');
    expect(html).toContain("How it runs");
    expect(html).toContain("Close the dashboard. The Mac keeps the record.");
    expect(html).toContain("This Mac only");
    expect(html).toContain("SQLite on disk");
    expect(html).toContain('href="/app"');
    expect(html).toContain("View on GitHub");
    expect(html).toContain("MIT");
    expect(html).not.toContain("—");
    expect(html).not.toContain("–");
  });
});
