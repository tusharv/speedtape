import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RangeTabs } from "@/app/components/stats";

describe("RangeTabs", () => {
  it("uses buttons when onSelect is provided so changing range does not navigate", () => {
    const html = renderToStaticMarkup(
      <RangeTabs range="24h" onSelect={() => undefined} />,
    );

    expect(html).toContain("<button");
    expect(html).not.toContain('href="/app?range=7d"');
    expect(html).not.toContain('href="/app?range=all"');
  });

  it("keeps archive range chips as links", () => {
    const html = renderToStaticMarkup(
      <RangeTabs
        range="all"
        hrefFor={(range) => `/app/runs?range=${range}`}
        label="Archive range"
      />,
    );

    expect(html).toContain('href="/app/runs?range=7d"');
    expect(html).toContain('href="/app/runs?range=30d"');
  });
});
