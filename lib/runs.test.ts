import { describe, expect, it } from "vitest";
import { parseRunQuery, runHref } from "@/lib/runs";

describe("parseRunQuery", () => {
  it("defaults unknown and missing values", () => {
    expect(parseRunQuery({})).toEqual({
      range: "24h",
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      page: 1,
    });
    expect(
      parseRunQuery({
        range: "nope",
        status: "weird",
        slow: "yes",
        ping: "true",
        sort: "fastest",
        page: "0",
      }),
    ).toEqual({
      range: "24h",
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      page: 1,
    });
  });

  it("reads known values", () => {
    expect(
      parseRunQuery({
        range: "7d",
        status: "failed",
        slow: "1",
        ping: "1",
        sort: "slowest-down",
        page: "3",
      }),
    ).toEqual({
      range: "7d",
      status: "failed",
      slow: true,
      ping: true,
      sort: "slowest-down",
      page: 3,
    });
  });
});

describe("runHref", () => {
  it("omits default params", () => {
    expect(
      runHref({
        range: "24h",
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
        page: 1,
      }),
    ).toBe("/?range=24h");
  });

  it("includes only non-default params", () => {
    expect(
      runHref({
        range: "7d",
        status: "ok",
        slow: true,
        ping: true,
        sort: "highest-ping",
        page: 2,
      }),
    ).toBe("/?range=7d&status=ok&slow=1&ping=1&sort=highest-ping&page=2");
  });
});
