import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AddAgentForm } from "@/app/components/add-agent-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

describe("AddAgentForm", () => {
  it("asks for a name, interval or clock times, and Add agent", () => {
    const html = renderToStaticMarkup(<AddAgentForm />);
    expect(html).toContain("Name");
    expect(html).toContain("Interval");
    expect(html).toContain("Clock times");
    expect(html).toContain("Add agent");
    expect(html).toContain("15 min");
    expect(html).toContain("1 hour");
  });
});
