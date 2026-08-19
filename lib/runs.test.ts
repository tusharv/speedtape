import { describe, expect, it } from "vitest";
import {
  archiveHref,
  configHref,
  exportHref,
  firstSearchParam,
  formatRunId,
  homeHref,
  parseArchiveQuery,
  parseRunId,
  runCardId,
  runDetailHref,
} from "@/lib/runs";

describe("firstSearchParam", () => {
  it("returns a string as-is and the first entry of an array", () => {
    expect(firstSearchParam("7d")).toBe("7d");
    expect(firstSearchParam(["ok", "failed"])).toBe("ok");
    expect(firstSearchParam(undefined)).toBeUndefined();
  });
});

describe("parseArchiveQuery", () => {
  it("defaults unknown values to all-time and ignores page", () => {
    expect(parseArchiveQuery({})).toEqual({
      range: "all",
      from: null,
      to: null,
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      isp: null,
    });
    expect(
      parseArchiveQuery({
        range: "nope",
        status: "weird",
        page: "9",
        sort: "oldest",
        slow: "1",
      }),
    ).toEqual({
      range: "all",
      from: null,
      to: null,
      status: "all",
      slow: true,
      ping: false,
      sort: "oldest",
      isp: null,
    });
  });

  it("reads a time window", () => {
    expect(parseArchiveQuery({ range: "7d", status: "failed" })).toEqual({
      range: "7d",
      from: null,
      to: null,
      status: "failed",
      slow: false,
      ping: false,
      sort: "newest",
      isp: null,
    });
  });

  it("reads a service provider and ignores blank names", () => {
    expect(parseArchiveQuery({ isp: "Spectrum" }).isp).toBe("Spectrum");
    expect(parseArchiveQuery({ isp: "  Comcast Cable  " }).isp).toBe(
      "Comcast Cable",
    );
    expect(parseArchiveQuery({ isp: "   " }).isp).toBeNull();
  });

  it("reads start and end days and swaps them when inverted", () => {
    expect(
      parseArchiveQuery({
        from: "2026-08-10",
        to: "2026-08-01",
        range: "7d",
      }),
    ).toEqual({
      range: "all",
      from: "2026-08-01",
      to: "2026-08-10",
      status: "all",
      slow: false,
      ping: false,
      sort: "newest",
      isp: null,
    });
  });
});

describe("homeHref", () => {
  it("omits the default 24h range", () => {
    expect(homeHref("24h")).toBe("/app");
    expect(homeHref("7d")).toBe("/app?range=7d");
  });
});

describe("configHref", () => {
  it("points at the config page", () => {
    expect(configHref()).toBe("/app/config");
  });
});

describe("archiveHref", () => {
  it("omits default archive params", () => {
    expect(
      archiveHref({
        range: "all",
        from: null,
        to: null,
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
        isp: null,
      }),
    ).toBe("/app/runs");
  });

  it("includes only non-default archive params", () => {
    expect(
      archiveHref({
        range: "7d",
        from: null,
        to: null,
        status: "failed",
        slow: true,
        ping: true,
        sort: "oldest",
        isp: "Spectrum",
      }),
    ).toBe(
      "/app/runs?range=7d&status=failed&slow=1&ping=1&sort=oldest&isp=Spectrum",
    );
    expect(
      archiveHref({
        range: "all",
        from: "2026-08-01",
        to: "2026-08-10",
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
        isp: null,
      }),
    ).toBe("/app/runs?from=2026-08-01&to=2026-08-10");
  });
});

describe("exportHref", () => {
  it("points at the CSV export with the same archive filters", () => {
    expect(
      exportHref({
        range: "all",
        from: null,
        to: null,
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
        isp: null,
      }),
    ).toBe("/app/runs/export");
    expect(
      exportHref({
        range: "30d",
        from: null,
        to: null,
        status: "failed",
        slow: true,
        ping: true,
        sort: "oldest",
        isp: "Comcast Cable",
      }),
    ).toBe(
      "/app/runs/export?range=30d&status=failed&slow=1&ping=1&sort=oldest&isp=Comcast+Cable",
    );
    expect(
      exportHref({
        range: "all",
        from: "2026-08-01",
        to: "2026-08-03",
        status: "all",
        slow: false,
        ping: false,
        sort: "newest",
        isp: null,
      }),
    ).toBe("/app/runs/export?from=2026-08-01&to=2026-08-03");
  });
});

describe("runDetailHref", () => {
  it("points at the run detail page", () => {
    expect(runDetailHref(42)).toBe("/app/runs/42");
  });
});

describe("parseRunId", () => {
  it("accepts a positive integer id and rejects junk", () => {
    expect(parseRunId("42")).toBe(42);
    expect(parseRunId("0")).toBeNull();
    expect(parseRunId("-1")).toBeNull();
    expect(parseRunId("42a")).toBeNull();
    expect(parseRunId("042")).toBeNull();
  });
});

describe("runCardId", () => {
  it("prefixes the numeric run id for a stable DOM id", () => {
    expect(runCardId(42)).toBe("run-42");
  });
});

describe("formatRunId", () => {
  it("shows the run id as a hash label", () => {
    expect(formatRunId(42)).toBe("#42");
  });
});
