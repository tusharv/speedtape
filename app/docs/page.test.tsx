import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DocsPage, { metadata } from "@/app/docs/page";
import {
  DOCS_HREF,
  DOCS_LABEL,
  DOCS_LEDE,
  DOCS_TITLE,
  WINDOWS_BUILD_TOOLS_NOTE,
  WINDOWS_COMMANDS,
} from "@/lib/guide";

describe("Speedtape docs page", () => {
  it("renders Mac, Windows, and agent instructions", () => {
    const html = renderToStaticMarkup(<DocsPage />);

    expect(html).toContain(DOCS_TITLE);
    expect(html).toContain(DOCS_LEDE);
    expect(html).toContain('id="mac"');
    expect(html).toContain('id="windows"');
    expect(html).toContain('id="agents"');
    expect(html).toContain('href="#mac"');
    expect(html).toContain('href="#windows"');
    expect(html).toContain('href="#agents"');
    expect(html).toContain("brew tap teamookla/speedtest");
    expect(html).toContain("brew install speedtest");
    expect(html).toContain(WINDOWS_COMMANDS[0].command);
    expect(html).toContain("command -v speedtest");
    expect(html).toContain("where.exe speedtest");
    expect(html).toContain("Check Speedtest CLI");
    expect(html).toContain("Read logs without the dashboard");
    expect(html).toContain("speedtape.out.log");
    expect(html).toContain(WINDOWS_BUILD_TOOLS_NOTE);
    expect(html).toContain("AI agents");
    expect(html).toContain("What the tool is");
    expect(html).toContain("Before you edit");
    expect(html).not.toContain("Coding agents");
    expect(html).toContain("node_modules/next/dist/docs/");
    expect(html).toContain('href="/app"');
    expect(html).not.toContain("\u2014");
    expect(html).not.toContain("\u2013");
  });

  it("uses the landing chrome and a single h1", () => {
    const html = renderToStaticMarkup(<DocsPage />);

    expect(html).toContain('aria-label="Speedtape home"');
    expect(html).toContain('href="/"');
    expect(html).toContain(DOCS_LABEL);
    expect(html.match(/<h1/g) ?? []).toHaveLength(1);
    expect(html.match(/<h2/g) ?? []).toHaveLength(3);
    expect(metadata.title).toBe("Docs");
    expect(DOCS_HREF).toBe("/docs");
  });
});
