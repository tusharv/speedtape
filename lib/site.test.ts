import { describe, expect, it } from "vitest";
import {
  APP_NAME,
  GITHUB_URL,
  LICENSE_LABEL,
  OG_IMAGE_ALT,
  OG_IMAGE_URL,
  PAGES_URL,
} from "@/lib/site";

describe("site", () => {
  it("names the public project", () => {
    expect(APP_NAME).toBe("Speedtape");
    expect(LICENSE_LABEL).toBe("MIT");
    expect(GITHUB_URL).toBe("https://github.com/tusharv/speedtape");
    expect(PAGES_URL).toBe("https://tusharv.github.io/speedtape");
    expect(OG_IMAGE_URL).toBe("https://tusharv.github.io/speedtape/og.png");
    expect(OG_IMAGE_ALT).toBe("Speedtape 24 hour sample tape");
  });
});
