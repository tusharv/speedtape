import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Landing from "@/app/page";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

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
    expect(html).toContain("Close the dashboard. This computer keeps the record.");
    expect(html).toContain("This computer only");
    expect(html).toContain("macOS and Windows");
    expect(html).toContain("SQLite on disk");
    expect(html).toContain('href="/app"');
    expect(html).toContain("View on GitHub");
    expect(html).toContain("MIT");
    expect(html).not.toContain("—");
    expect(html).not.toContain("–");
  });

  it("renders responsive navigation and accessible interaction states", async () => {
    const page = await Landing({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto");
    expect(html).toContain(
      "md:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)]",
    );
    expect(html).toContain("md:items-end");
    expect(html).toContain("md:gap-10");
    expect(html).toContain("lg:gap-16");
    expect(html).toContain("min-h-16");
    expect(html).toContain("hover:bg-paper");
    expect(html).toContain("hover:text-ink");
    expect(html).not.toContain(
      "lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)]",
    );
    expect(html).not.toContain("min-h-20");
    expect(html).not.toContain("hover:bg-amber");
    expect(
      html.match(
        /class="rounded-lg outline-none transition-colors hover:text-copper focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-ink"/g,
      ) ?? [],
    ).toHaveLength(2);
  });

  it("renders the intended landmark and heading hierarchy", async () => {
    const page = await Landing({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(page);

    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
    expect(html.match(/<h2/g) ?? []).toHaveLength(2);
    expect(html.match(/<nav/g) ?? []).toHaveLength(2);
    expect(html.match(/href="\/app"/g) ?? []).toHaveLength(3);
  });

  it("preserves range query redirects to the dashboard", async () => {
    redirectMock.mockClear();

    await Landing({
      params: Promise.resolve({}),
      searchParams: Promise.resolve({ range: "7d", slow: "1" }),
    });

    expect(redirectMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/app?range=7d&slow=1");
  });
});
