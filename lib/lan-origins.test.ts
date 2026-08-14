import os from "node:os";
import { describe, expect, it } from "vitest";
import { lanDevOrigins } from "@/lib/lan-origins";

describe("lanDevOrigins", () => {
  it("allows private LAN IP patterns and this machine's addresses", () => {
    const origins = lanDevOrigins({
      en0: [
        {
          address: "192.168.1.13",
          netmask: "255.255.255.0",
          family: "IPv4",
          mac: "00:00:00:00:00:00",
          internal: false,
          cidr: "192.168.1.13/24",
        },
        {
          address: "127.0.0.1",
          netmask: "255.0.0.0",
          family: "IPv4",
          mac: "00:00:00:00:00:00",
          internal: true,
          cidr: "127.0.0.1/8",
        },
      ],
    } as NodeJS.Dict<os.NetworkInterfaceInfo[]>);

    expect(origins).toContain("192.168.*.*");
    expect(origins).toContain("10.*.*.*");
    expect(origins).toContain("172.*.*.*");
    expect(origins).toContain("*.local");
    expect(origins).toContain("192.168.1.13");
    expect(origins).not.toContain("127.0.0.1");
  });
});
