import { describe, expect, it } from "vitest";
import { APP_NAME, GITHUB_URL, LICENSE_LABEL } from "@/lib/site";

describe("site", () => {
  it("names the public project", () => {
    expect(APP_NAME).toBe("Speedtape");
    expect(LICENSE_LABEL).toBe("MIT");
    expect(GITHUB_URL).toBe(
      "https://github.com/tusharvagela/home-network-checker",
    );
  });
});
